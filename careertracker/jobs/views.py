from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from .models import JobApplication
from .serializers import JobApplicationSerializer
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend

# Create your views here.

class JobListView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'remote', 'source', 'confidence', 'role_type']
    search_fields = ['company', 'job_title', 'location', 'contacts', 'notes']
    ordering_fields = ['applied_at', 'salary_est', 'resume_match', 'confidence']
    
    ordering = ['-applied_at']
    
    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).order_by('-applied_at')
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
class JobUpdateView(generics.RetrieveUpdateDestroyAPIView):
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
        
        return Response({
            'total_applications': total_applications,
            'status_breakdown': status_breakdown
        })