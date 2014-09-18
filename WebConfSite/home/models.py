from django.db import models

ConnType = (
	('P2P', 'Peer-to-Peer'),
	('S2C', 'Server-to-Clients'),
)

# Create your models here.
class User(models.Model):
	email			= models.CharField(max_length=80, unique=True)
	firstname		= models.CharField(max_length=50)
	lastname		= models.CharField(max_length=50)
	invitedsessions	= models.ForeignKey('NewSession')
	def __unicode__(self):
		return self.email

class NewSession(models.Model):
	sessionID 		= models.AutoField(primary_key=True, unique=True)
	sessionHost		= models.ForeignKey('User')
	sessionType		= models.CharField(max_length=3, choices=ConnType)
	dateTCreated	= models.DateTimeField(auto_now_add=True)
	def __unicode__(self):
		return self.sessionID
		
class ManagedSession(models.Model):
	MSsessionID		= models.ForeignKey('NewSession')
	MSinvitedusers	= models.ForeignKey('User')
	def __unicode__(self):
		return self.sessionID
