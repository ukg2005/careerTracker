from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from jobs.models import Interview
from datetime import timedelta

class Command(BaseCommand):
    help = 'Sends email reminders for interviews happening in the next 24 hrs.'
    
    def handle(self, *args, **kwargs):
        now = timezone.now()
        tomorrow = now + timedelta(hours=24)
        upcoming_interviews = Interview.objects.filter(
            interview_at__range=(now, tomorrow), remainder_sent=False
        )
        
        count = 0
        for interview in upcoming_interviews:
            user = interview.job.user
            
            subject = f'Reminder: Interview with {interview.job.company} tomorrow!'
            message = (
                f'Hi {user.username},\n\n'
                f'Good Luck! You have a {interview.type} interview with {interview.job.company}\n'
                f'Time: {interview.interview_at.strftime('%Y-%m-%d %H:%M')}\n'
                f'Type: {interview.type}\n'
                f'Link: {interview.meeting_link or 'Check details'}\n'
                f'Prepare well!'
            )
            
            try:
                send_mail(
                    subject, message, 
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=False
                )
                self.stdout.write(self.style.SUCCESS(f'Send email to {user.email}'))
                count += 1
                interview.remainder_sent = True
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to send to {user.email}: {str(e)}'))
        self.stdout.write(self.style.SUCCESS(f'Sucessfully sent {count} reminders'))
            
            