from django.db import models
from django.contrib.auth.models import User

class NewSession(models.Model):
	sessionID 		= models.AutoField(primary_key=True, unique=True)
	sessionName 	= models.CharField(max_length=33)
	sessionHost		= models.ForeignKey(User)
	sessionPrivate	= models.BooleanField(default=False) #if locked only invited users can enter
	sessionActive	= models.BooleanField(default=True)
	dateTCreated	= models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = 'Created Session'
		verbose_name_plural = 'Created Sessions'

	def __unicode__(self):
		return self.sessionName
		
class InvitedToSession(models.Model):
	sessionName		= models.ForeignKey(NewSession)
	invitedUsers	= models.ForeignKey(User)

	class Meta:
		verbose_name = 'User Invites to Session'
		verbose_name_plural = 'User Invites to Session'

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
	Timestamp	= models.DateTimeField()

	class Meta:
		verbose_name = 'Session Activity'
		verbose_name_plural = 'Session Activity'

	def __unicode__(self):
		return self.sessionName.sessionName

class QoEassessment(models.Model):
	sessionName 	= models.ForeignKey(NewSession)
	sessionUser		= models.CharField(max_length=50)
	tostreamID		= models.CharField(max_length=50)
	VideoSentDR		= models.DecimalField(max_digits=8, decimal_places=3, default=0)
	VideoRecvDR 	= models.DecimalField(max_digits=8, decimal_places=3, default=0)
	AudioSentDR 	= models.DecimalField(max_digits=8, decimal_places=3, default=0)
	AudioRecvDR 	= models.DecimalField(max_digits=8, decimal_places=3, default=0)
	VidPL			= models.IntegerField(blank=True)
	AudPL			= models.IntegerField(blank=True)
	VidDelay		= models.IntegerField(blank=True)
	AudDelay		= models.IntegerField(blank=True)
	Timestamp		= models.DateTimeField()

	class Meta:
		verbose_name = 'Logged QoS Values'
		verbose_name_plural = 'Logged QoS Values'

	def __unicode__(self):
		return self.sessionName.sessionName

class BadAssessment(models.Model):
	AudioVideo = 	(
						('A', 'Audio'), 
						('V', 'Video'),
					)
	sessionName 	= models.ForeignKey(NewSession)
	sessionUser		= models.CharField(max_length=50)
	RatingType		= models.CharField(max_length=1, choices=AudioVideo)
	Timestamp		= models.DateTimeField()

	class Meta:
		verbose_name = 'Submitted QoE Values'
		verbose_name_plural = 'Submitted QoE Values'

	def __unicode__(self):
		return self.sessionName.sessionName