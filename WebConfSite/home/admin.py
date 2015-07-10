from django.contrib import admin
from home.models import NewSession, InvitedToSession, ManagedSession, QoEassessment, BadAssessment
from django.contrib.auth.models import User
# Register your models here.
#admin.site.register(User)

class MSDisplay(admin.ModelAdmin):
	def time_seconds(self, obj):
		return obj.Timestamp.strftime("%d-%b-%Y | %H:%M:%S")
	time_seconds.short_description = 'Precise Time' 
	list_display = ('sessionName', 'sessionUser', 'UserActivity', 'time_seconds')

class ItSDisplay(admin.ModelAdmin):
	list_display = ('sessionName', 'invitedUsers')

class NSSDisplay(admin.ModelAdmin):
	def time_seconds(self, obj):
		return obj.dateTCreated.strftime("%d-%b-%Y | %H:%M:%S")
	time_seconds.short_description = 'Precise Time' 
	list_display = ('sessionName', 'sessionHost', 'sessionPrivate', 'sessionActive', 'time_seconds')

class QoEDisplay(admin.ModelAdmin):
	def time_seconds(self, obj):
		return obj.Timestamp.strftime("%d-%b-%Y | %H:%M:%S")
	time_seconds.short_description = 'Precise Time' 
	list_display = ('sessionName', 'sessionUser', 'tostreamID', 'VideoSentDR', 'VideoRecvDR', 'AudioSentDR', 'AudioRecvDR', 'VidPL', 'AudPL', 'VidDelay', 'AudDelay', 'time_seconds')

class BadDisplay(admin.ModelAdmin):
	def time_seconds(self, obj):
		return obj.Timestamp.strftime("%d-%b-%Y | %H:%M:%S")
	time_seconds.short_description = 'Precise Time' 
	list_display = ('sessionName', 'sessionUser', 'RatingType', 'time_seconds')

admin.site.register(NewSession, NSSDisplay)
admin.site.register(InvitedToSession, ItSDisplay)
admin.site.register(ManagedSession, MSDisplay)
admin.site.register(QoEassessment, QoEDisplay)
admin.site.register(BadAssessment, BadDisplay)
