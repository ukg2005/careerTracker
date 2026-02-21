from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class JobApplication(models.Model):
    status_types = (
        ('APPLIED', 'Applied'),
        ('GHOSTED', 'Ghosted'),
        ('INTERVIEW', 'Interview'),
        ('REPLIED', 'Replied')
    )
    
    confidence_types = (
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low')
    )
    
    source_types = (
        ('LINKEDIN', 'LinkedIn'),
        ('REFERRAL', 'Referral'),
        ('JOB_PORTAL', 'Job Portal'),
        ('COMPANY_WEBSITE', 'Company Website'),
        ('COLLEGE', 'College / Campus'),
        ('NETWORKING', 'Networking'),
        ('RECRUITER', 'Recruiter'),
        ('OTHER', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    job_title = models.CharField(max_length=200)
    role_type = models.CharField(max_length=200)
    company = models.CharField(max_length=50)
    applied_at = models.DateTimeField(auto_now_add=True)
    duration = models.CharField(max_length=30)
    salary_est = models.IntegerField(blank=True, null=True)
    resume_match = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=status_types)
    location = models.CharField(max_length=200)
    link = models.URLField(max_length=500)
    confidence = models.CharField(max_length=10, choices=confidence_types)
    contacts = models.CharField(max_length=200, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    source = models.CharField(max_length=50, choices=source_types, null=True, blank=True)
    remote = models.BooleanField(default=False)
    
    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name} -> {self.job_title}'