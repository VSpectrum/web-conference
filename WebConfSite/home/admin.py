from django.contrib import admin
from home.models import User, NewSession, ManagedSession
# Register your models here.
admin.site.register(User)
admin.site.register(NewSession)
admin.site.register(ManagedSession)