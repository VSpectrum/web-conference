from django.contrib import admin
from home.models import NewSession, InvitedToSession, ManagedSession, QoEassessment
from django.contrib.auth.models import User
# Register your models here.
#admin.site.register(User)
admin.site.register(NewSession)
admin.site.register(InvitedToSession)
admin.site.register(ManagedSession)
admin.site.register(QoEassessment)