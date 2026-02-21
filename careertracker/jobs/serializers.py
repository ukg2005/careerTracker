from rest_framework import serializers
from .models import JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_title', 'company', 'role_type', 
            'status', 'location', 'link', 'confidence', 
            'duration', 'salary_est', 'resume_match', 
            'contacts', 'notes', 'source',
            'applied_at'
        ]
        read_only_fields = ['applied_at']