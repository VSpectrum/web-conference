from django.conf.urls import patterns, include, url
from home import views
from django.core.urlresolvers import reverse


urlpatterns = patterns('home.views',
    url(r'^$', views.index),
	#url(r'', include('social_auth.urls')),
	url('', include('social.apps.django_app.urls', namespace='social')),
)