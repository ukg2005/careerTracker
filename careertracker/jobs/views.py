from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from .models import JobApplication, Interview, JobDocument
from .serializers import JobApplicationSerializer, InterviewSerializer, JobDocumentSerialzier
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend

# Create your views here.

class JobListView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_remote', 'source', 'confidence', 'role_type']
    search_fields = ['company', 'job_title', 'location', 'contacts', 'notes']
    ordering_fields = ['applied_at', 'salary_est', 'resume_match', 'confidence']
    
    ordering = ['-applied_at']
    
    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).order_by('-applied_at')
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)

class JobAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        total_applications = JobApplication.objects.filter(user=user).count()
        status_breakdown = (
            JobApplication.objects.filter(user=user)
            .values('status')
            .annotate(count=Count('status'))
            .order_by('-count')
        )
        
        total_offers = JobApplication.objects.filter(user=user, status='OFFER').count()
        interview_count = JobApplication.objects.filter(user=user, status='INTERVIEW').count()
        rejection_count = JobApplication.objects.filter(user=user, status='REJECTED').count()
        
        if total_applications > 0:
            offer_rate = round((total_offers / total_applications) * 100)
            rejection_rate = round((rejection_count / total_applications) * 100)
            interview_rate = round((interview_count / total_applications) * 100)
        else:
            offer_rate = 0
            rejection_rate = 0
            interview_rate = 0
        
        return Response({
            'total_applications': total_applications,
            'status_breakdown': status_breakdown,
            'analytics': {
                'offer_rate': offer_rate,
                'rejection_rate': rejection_rate,
                'interview_rate': interview_rate,
                'total_offers': total_offers,
                'interview_count': interview_count
            }
        })

class InterviewListView(generics.ListCreateAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Interview.objects.filter(job__user=self.request.user).order_by('-interview_at')

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

class InterviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Interview.objects.filter(job__user=self.request.user)

class JobDocumentListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = JobDocumentSerialzier
    
    def get_queryset(self):
        return JobDocument.objects.filter(job__user=self.request.user)

    def perform_create(self, serializer):
        job_id = self.request.GET.get('job')
        job = JobApplication.objects.get(id=job_id, user=self.request.user)
        serializer.save(job=job)

class JobDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = JobDocumentSerialzier
    
    def get_queryset(self):
        return JobDocument.objects.filter(job__user=self.request.user)
