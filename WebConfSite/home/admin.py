from django.contrib import admin
from home.models import NewSession, InvitedToSession, ManagedSession, QoEassessment, BadAssessment
from django.contrib.auth.models import User
# Register your models here.
#admin.site.register(User)

class MSDisplay(admin.ModelAdmin):
    list_display = ('sessionName', 'sessionUser', 'UserActivity', 'Timestamp')

class ItSDisplay(admin.ModelAdmin):
    list_display = ('sessionName', 'invitedUsers')

class NSSDisplay(admin.ModelAdmin):
    list_display = ('sessionName', 'sessionHost', 'sessionPrivate', 'sessionActive', 'dateTCreated')

class QoEDisplay(admin.ModelAdmin):
	list_display = ('sessionName', 'sessionUser', 'VideoSentDR', 'VideoRecvDR', 'AudioSentDR', 'AudioRecvDR')

class BadDisplay(admin.ModelAdmin):
	list_display = ('sessionName', 'sessionUser', 'RatingType', 'Timestamp')

admin.site.register(NewSession, NSSDisplay)
admin.site.register(InvitedToSession, ItSDisplay)
admin.site.register(ManagedSession, MSDisplay)
admin.site.register(QoEassessment, QoEDisplay)
admin.site.register(BadAssessment, BadDisplay)
