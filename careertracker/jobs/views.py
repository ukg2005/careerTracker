from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import JobApplication
from .serializers import JobApplicationSerializer

# Create your views here.

class JobListView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).order_by('-applied_at')
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
    