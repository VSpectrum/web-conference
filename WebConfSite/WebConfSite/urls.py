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
    url(r'^login$', views.newsession ), 
	url(r'^logout$', views.logout ),
    #url(r'^testsock$', login_required(TemplateView.as_view(template_name="conference.html"))), 
    url(r'^(?P<Uusername>([a-z0-9_\.-]+))/$', views.getUser ),
)