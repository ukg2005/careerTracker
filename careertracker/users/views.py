import random
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
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


logger = logging.getLogger(__name__)

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    try:
        email = (request.data.get('email') or '').strip()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.create(email=email, otp=otp)

        send_mail(
            subject='OTP for CareerTracker',
            message=f'Your otp is {otp}',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None) or settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'otp sent'})
    except Exception as exc:
        logger.exception('send_otp failed for email=%s', request.data.get('email'))
        return Response(
            {'error': 'Unable to send OTP email right now. Please try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    record = EmailOTP.objects.filter(email=email, otp=otp).last()
    if not record:
        return Response({'error': 'Invalid OTP'})
    if record.created_at < now() - timedelta(minutes=5):
        record.delete()
        return Response({'error': 'Expired OTP'})
    
    user, created = User.objects.get_or_create(email=email, username=email)
    refresh = RefreshToken.for_user(user)
    
    EmailOTP.objects.filter(email=email).delete()
    
    return Response({'access': str(refresh.access_token),
                    'refresh': str(refresh)
    })

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