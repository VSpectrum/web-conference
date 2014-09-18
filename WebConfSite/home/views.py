from django.shortcuts import render, render_to_response, redirect, get_object_or_404
from django.template import RequestContext
from django.http import HttpResponse, Http404
from django.contrib.sessions.models import Session

from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout

from django.contrib.auth.models import User
from friendship.models import Friend, Follow
#########################################################################

### Home Page ###
def index(request):
	return render_to_response('home/index.html', context_instance = RequestContext(request))

### Logout and Redirect to Home Page ###
def logout(request):
	auth_logout(request)
	return redirect("/")	

### Successful login redirection to user's home page ###
@login_required
def newsession(request):
	username = str(request.user)
	return redirect('/'+username)

### Loading (any) user's page ###
@login_required
def getUser(request, Uusername):
	try:
		test = User.objects.get(username=Uusername)
	except:
		return Http404

	if str(request.user) == str(Uusername): ## if user is on his/her own page
		data = {'username': test.get_full_name()}
		return render_to_response('secrets.html', data, context_instance = RequestContext(request))

	else:
		data = {'username': 'visitor!'} ## if user is on another person's page
		return render_to_response('secrets.html', data, context_instance = RequestContext(request))
		#return Http404