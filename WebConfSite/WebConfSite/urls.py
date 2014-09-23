from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import logout
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from django.core.urlresolvers import reverse
from home import views
from django.conf.urls.static import static

urlpatterns = patterns('',
    url('', include('social.apps.django_app.urls', namespace='social')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'', include('django_socketio.urls')),
    url(r'^$', include('home.urls'), ),
    url(r'^login$', views.loaduser ), 
	url(r'^logout$', views.logout ),
	url(r'^user-search/$', views.usersearch ),
	url(r'^leave-session/$', views.leavesession ),
	url(r'^enter-session/$', views.entersession ),

	url(r'^(?P<Uusername>([a-z0-9_\.-]+))/invite/$', views.inviteuser ),
    url(r'^(?P<Uusername>([a-z0-9_\.-]+))/$', views.getUser ),
    url(r'^(?P<Uusername>([a-z0-9_\.-]+))/(?P<Usessname>([a-f0-9]{32}))/$', views.userConfSession ),
    
)