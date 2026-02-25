from rest_framework import serializers
from .models import JobApplication, Interview, JobDocument

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        
class JobDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDocument
        fields = '__all__'
        read_only_fields = ['uploaded_at']

    def validate_job(self, value):
        user = self.context['request'].user
        if value.user != user:
             raise serializers.ValidationError("You cannot upload documents to a job you do not own.")
        return value
        
class JobApplicationSerializer(serializers.ModelSerializer):
    interviews = InterviewSerializer(many=True, read_only=True)
    documents = JobDocumentSerializer(many=True, read_only=True)
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('user',)
