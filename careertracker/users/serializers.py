from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    linkedin_url = serializers.URLField(allow_blank=True, allow_null=True, required=False)
    github_url = serializers.URLField(allow_blank=True, allow_null=True, required=False)
    portfolio_url = serializers.URLField(allow_blank=True, allow_null=True, required=False)
    
    def to_internal_value(self, data):
        for field in ['linkedin_url', 'portfolio_url', 'github_url']:
            if field in data and isinstance(data[field], str) and data[field].strip():
                value = data[field].strip()
                if not value.startswith(('http://', 'https://')):
                    data[field] = f'https://{value}'
        return super().to_internal_value(data)

    class Meta:
        model = Profile
        fields = ['user', 'bio', 'linkedin_url', 'portfolio_url', 'github_url', 'created_at']
    
    def update(self, instance, validated_data):
        user_data = self.initial_data.get('user', {}) if hasattr(self, 'initial_data') and isinstance(self.initial_data, dict) else {}
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        user.save()
        
        instance.bio = validated_data.get('bio', instance.bio)
        instance.linkedin_url = validated_data.get('linkedin_url', instance.linkedin_url)
        instance.portfolio_url = validated_data.get('portfolio_url', instance.portfolio_url)
        instance.github_url = validated_data.get('github_url', instance.github_url)
        instance.save()
        
        return instance