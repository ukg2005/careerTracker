from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import os

# Create your models here.

def resume_upload_path(instance, filename):
    return os.path.join('resumes/', filename)

class JobApplication(models.Model):
    STATUS_TYPES = (
        ('APPLIED', 'Applied'),
        ('GHOSTED', 'Ghosted'),
        ('INTERVIEW', 'Interview'),
        ('REPLIED', 'Replied'),
        ('OFFER', 'Offer'),
        ('REJECTED', 'Rejected')
    )
    
    CONFIDENCE_TYPES = (
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low')
    )
    
    SOURCE_TYPES = (
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
    status = models.CharField(max_length=10, choices=STATUS_TYPES)
    location = models.CharField(max_length=200)
    application_link = models.URLField(max_length=500, null=True, blank=True)
    confidence = models.CharField(max_length=10, choices=CONFIDENCE_TYPES)
    contacts = models.CharField(max_length=200, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    source = models.CharField(max_length=50, choices=SOURCE_TYPES, null=True, blank=True)
    
    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name} -> {self.job_title}'

class JobDocument(models.Model):
    FILE_TYPES = (
        ('RESUME', 'Resume'),
        ('COLD EMAIL', 'Cold Email'),
        ('COVER LETTER', 'Cover Letter'),
        ('OTHERS', 'Others')
    )
    
    job = models.ForeignKey(JobApplication, on_delete=models.CASCADE)
    file = models.FileField(upload_to='job_documents/')
    doc_types = models.CharField(max_length=20,  choices=FILE_TYPES)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        type_display = dict(self.FILE_TYPES).get(self.doc_types, self.doc_types)
        return f'{type_display} - {self.job.company}'

class Interview(models.Model):
    interview_types = (
        ('HR', 'Hr'),
        ('BEHAVIOURAL', 'Behavioural'),
        ('TECHNICAL', 'Technical'),
        ('MANAGERIAL', 'Managerial'),
        ('GD', 'Gd'),
        ('OTHERS', 'Others')
    )
    
    job = models.ForeignKey(JobApplication, on_delete=models.CASCADE)
    interview_at = models.DateTimeField()
    interview_with = models.CharField(max_length=100)
    meeting_link = models.URLField(max_length=500)
    type = models.CharField(max_length=15, choices=interview_types)
    remainder_sent = models.BooleanField(default=False)
    feedback = models.TextField(blank=True, null=True)
    rating = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    
    def __str__(self):
        return f'{self.job.company} -> {self.type}'
    