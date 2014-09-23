from django.shortcuts import render, render_to_response, redirect, get_object_or_404
from django.template import RequestContext
from django.http import HttpResponse, Http404
from django.contrib.sessions.models import Session

from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout

from django.contrib.auth.models import User
from friendship.models import Friend, Follow
from home.models import NewSession, InvitedToSession, ManagedSession

import hashlib, random, json, datetime
#########################################################################

### Home Page ### / ------------------------------------------------------------------------------------------------------
def index(request):
	if str(request.user) == "AnonymousUser":
		return render_to_response('home/index.html', context_instance = RequestContext(request))
	else:
		return redirect('/'+str(request.user))

### Logout and Redirect to Home Page ### /logout -------------------------------------------------------------------------
def logout(request):
	auth_logout(request)
	return redirect("/")	

### Successful login redirection to user's home page ### /login ----------------------------------------------------------
@login_required
def loaduser(request):
	username = str(request.user)
	return redirect('/'+username)

### Loading (any) user's page ### /{{username}} --------------------------------------------------------------------------
@login_required
def getUser(request, Uusername):
	if request.method == 'GET':

		try:
			testuser = User.objects.get(username=Uusername)
		except User.DoesNotExist:
			raise Http404

		if str(request.user) == str(Uusername): ## if user is on his/her own page --
			myname = User.objects.get(username=str(request.user))
			data = {
						'pagename': str(myname.get_full_name()), 
						'pageuname': str(Uusername), 
						'myname': str(myname.get_full_name()),
						'myuname': str(request.user),
					} 

		else: ## if user is on another person's page --
			try:
				myname = User.objects.get(username=str(request.user))
				pageusername = User.objects.get(username=str(Uusername))
				data = {
							'pagename': str(pageusername.get_full_name()), 
							'pageuname': str(Uusername), 
							'myname': str(myname.get_full_name()), 
							'myuname': str(request.user),
						} 
			except User.DoesNotExist: ## exception if logged-in user is not in db? -- do 404 for now
				raise Http404

		return render_to_response('userpage.html', data, context_instance = RequestContext(request))
	
		
	## Handle POST data to create a temporary user session
	elif request.method == 'POST':
		sessname = str(hashlib.md5( str(request.user)+str(random.random()*42.42) ).hexdigest())
		sessmaker = str(request.user)
		sesstype = str(request.POST.get('Psessprivate', None))
		if sesstype=="True":
			sesstype = True
		else:
			sesstype = False

		host = User.objects.get(username=sessmaker)
		NewSession.objects.create(sessionName=sessname, sessionHost=host, sessionPrivate=sesstype)
		session = NewSession.objects.get(sessionName=sessname)
		InvitedToSession.objects.create(sessionName=session, invitedUsers=host)
		#return redirect('/'+sessmaker+'/'+sessname)
		return HttpResponse('/'+sessmaker+'/'+sessname)
	else:	
		return render_to_response('userpage.html', data, context_instance = RequestContext(request))


	## Create profile system for user
	## Create messaging system for footer of this page?

	

### Allow unauthenticated to use this session URL if permitted? ----------------------------------------------------------
### User-created temporary session where other users can be invited and interact ### /{{username}}/{{sessionname}}
def userConfSession(request, Uusername, Usessname): 

	try:
		testuser = User.objects.get(username=Uusername)
		testsess = NewSession.objects.get(sessionName=Usessname)
	except:
		raise Http404

	pagename = User.objects.get(username=str(Uusername)).get_full_name()

	if str(request.user)=="AnonymousUser":
		data = {
					'pagename': str(pagename),
					'pageuname': str(Uusername), 
					'myname': 'AnonymousUser', 
					'myuname': 'AnonymousUser',
					'sessname': str(Usessname),
				} 
	
	else:
		myname = User.objects.get(username=str(request.user))
		data = {
					'pagename': str(pagename),
					'pageuname': str(Uusername), 
					'myname': str(myname.get_full_name()),
					'myuname': str(request.user),
					'sessname': str(Usessname),
				} 

	if testsess.sessionActive:
		isPrivate = NewSession.objects.get(sessionName=str(Usessname)).sessionPrivate
		if isPrivate:
			session = NewSession.objects.get(sessionName=str(Usessname))
			userobj = User.objects.get(username=str(request.user))

			## gets lists of sessions user allowed in
			usersessionlist = list(InvitedToSession.objects.filter(invitedUsers=userobj)) 
			if str(session) in str(usersessionlist): ## is this session in that list?
				return render_to_response('sesspage.html', data, context_instance = RequestContext(request))
			else:
				raise Http404


		else:
			return render_to_response('sesspage.html', data, context_instance = RequestContext(request))

	else:
		session = NewSession.objects.get(sessionName=str(Usessname))
		if str(session.sessionHost.username) == str(request.user):
			NewSession.objects.filter(sessionName=str(Usessname)).update(sessionActive=True)
			return render_to_response('sesspage.html', data, context_instance = RequestContext(request))
		else:
			raise Http404

### POST handler to find users -------------------------------------------------------------------------------------------
def usersearch(request):
	if request.method == "POST":
		search_user = str(request.POST.get('search_user', None))
		sessionname = str(request.POST.get('sessionName', None))
		if search_user == '':
			return HttpResponse('')
		else:
			users = User.objects.filter(username__contains=search_user)
			data = 	{
						'users': users, 
						'sessname': str(sessionname),
					}
			return render_to_response('usersearch.html', data, context_instance = RequestContext(request))

### POST handler to invite users -----------------------------------------------------------------------------------------
def inviteuser(request, Uusername):
	if request.method == "POST":
		sessionname = str(request.POST.get('sessname', None))
		inviteduser = str(Uusername)

		sessionobj = NewSession.objects.get(sessionName=sessionname)
		sessionowner = str(sessionobj.sessionHost)

		if str(request.user) == sessionowner: ## if session owner has invited a user then add the user to conference
			inviteduserobj = User.objects.get(username=inviteduser)
			obj, created = InvitedToSession.objects.get_or_create(sessionName=sessionobj, invitedUsers=inviteduserobj, defaults={})

		return HttpResponse('')


### GET handler to leave session -----------------------------------------------------------------------------------------
def leavesession(request):
	if request.method == "GET":
		leftuser = str(request.user)
		sessname = str(request.GET.get('sessionname', None))
		session = NewSession.objects.get(sessionName=sessname)
		ManagedSession.objects.create(sessionName=session, sessionUser=leftuser, UserActivity="Left", TimeActivity=datetime.datetime.now())

		session = NewSession.objects.get(sessionName=sessname)
		if str(session.sessionHost.username) == leftuser:
			NewSession.objects.filter(sessionName=sessname).update(sessionActive=False)

		return HttpResponse('')

### GET handler to enter session -----------------------------------------------------------------------------------------
def entersession(request):
	if request.method == "GET":
		enteruser = str(request.user)
		sessname = str(request.GET.get('sessionname', None))
		session = NewSession.objects.get(sessionName=sessname)
		ManagedSession.objects.create(sessionName=session, sessionUser=enteruser, UserActivity="Enter", TimeActivity=datetime.datetime.now())

		return HttpResponse('')