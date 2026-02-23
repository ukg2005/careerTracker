from rest_framework import serializers
from .models import JobApplication, Interview

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        
class JobApplicationSerializer(serializers.ModelSerializer):
    interviews = InterviewSerializer(many=True, read_only=True)
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ['applied_at']
