import random
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from .models import EmailOTP, Profile
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.timezone import now
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from .serializers import ProfileSerializer
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import connection
from django.core.management import call_command
from django.core.mail import send_mail
import threading
import requests


logger = logging.getLogger(__name__)
_database_ready_lock = threading.Lock()
_database_ready = False


def ensure_database_ready():
    global _database_ready
    if _database_ready:
        return

    with _database_ready_lock:
        if _database_ready:
            return

        call_command('migrate', interactive=False, verbosity=0)
        _database_ready = True


def ensure_emailotp_table():
    existing_tables = connection.introspection.table_names()
    if EmailOTP._meta.db_table not in existing_tables:
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(EmailOTP)


def send_otp_email(email, otp):
    resend_api_key = getattr(settings, 'RESEND_API_KEY', '')
    resend_from_email = getattr(settings, 'RESEND_FROM_EMAIL', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', '')

    if resend_api_key:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {resend_api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': resend_from_email,
                'to': [email],
                'subject': 'OTP for CareerTracker',
                'text': f'Your otp is {otp}',
            },
            timeout=getattr(settings, 'EMAIL_TIMEOUT', 10),
        )
        response.raise_for_status()
        return

    send_mail(
        subject='OTP for CareerTracker',
        message=f'Your otp is {otp}',
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None) or settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    try:
        email = (request.data.get('email') or '').strip()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        ensure_database_ready()
        ensure_emailotp_table()

        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.create(email=email, otp=otp)

        send_otp_email(email, otp)
        return Response({'message': 'otp sent'})
    except Exception as exc:
        logger.exception('send_otp failed for email=%s', request.data.get('email'))
        # Return the actual error in response so user can see what failed
        error_msg = str(exc)
        print(f'send_otp ERROR: {error_msg}', flush=True)
        return Response(
            {'error': f'OTP failed: {error_msg}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    try:
        email = (request.data.get('email') or '').strip()
        otp = (request.data.get('otp') or '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        ensure_database_ready()
        record = EmailOTP.objects.filter(email=email, otp=otp).last()
        if not record:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        if record.created_at < now() - timedelta(minutes=5):
            record.delete()
            return Response({'error': 'Expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            username=email,
            defaults={'email': email},
        )
        if user.email != email:
            user.email = email
            user.save(update_fields=['email'])

        refresh = RefreshToken.for_user(user)

        EmailOTP.objects.filter(email=email).delete()

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    except Exception as exc:
        logger.exception('verify_otp failed for email=%s', request.data.get('email'))
        return Response(
            {'error': f'OTP verification failed: {exc}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            print('Validation Error:', serializer.errors)
        
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)