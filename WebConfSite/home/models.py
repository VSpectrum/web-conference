from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# class User(models.Model):
# 	email			= models.CharField(max_length=80, unique=True)
# 	firstname		= models.CharField(max_length=50)
# 	lastname		= models.CharField(max_length=50)
# 	invitedsessions	= models.ForeignKey('NewSession')
# 	def __unicode__(self):
# 		return self.email

class NewSession(models.Model):
	sessionID 		= models.AutoField(primary_key=True, unique=True)
	sessionName 	= models.CharField(max_length=33)
	sessionHost		= models.ForeignKey(User)
	sessionPrivate	= models.BooleanField(default=False) #if locked only invited users can enter
	sessionActive	= models.BooleanField(default=True)
	dateTCreated	= models.DateTimeField(auto_now_add=True)
	def __unicode__(self):
		return self.sessionName
		
class InvitedToSession(models.Model):
	sessionName		= models.ForeignKey(NewSession)
	invitedUsers	= models.ForeignKey(User)
	def __unicode__(self):
		return self.sessionName.sessionName

class ManagedSession(models.Model):
	EnteredLeft = 	(
						('Enter', 'Entered'), 
						('Left', 'Left'),
					)
	sessionName 	= models.ForeignKey(NewSession)
	sessionUser		= models.CharField(max_length=50)
	UserActivity	= models.CharField(max_length=5, choices=EnteredLeft)
	TimeActivity	= models.DateTimeField()
	def __unicode__(self):
		return self.sessionName.sessionName

class QoEassessment(models.Model):
	sessionName 	= models.ForeignKey(NewSession)
	VideoQuality	= models.CharField(max_length=2)
	VideoQuality	= models.CharField(max_length=2)
