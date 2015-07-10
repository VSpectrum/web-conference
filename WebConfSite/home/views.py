from django.shortcuts import render, render_to_response, redirect, get_object_or_404
from django.template import RequestContext
from django.http import HttpResponse, Http404
from django.contrib.sessions.models import Session

from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required

from django.contrib.auth.models import User
from home.models import *

from collections import Counter, defaultdict, OrderedDict
import hashlib, random, json, datetime
from pprint import pprint #debug
######################################################################################################

### Home Page ### / ------------------------------------------------------------------------------------------------------
def index(request):
	if str(request.user) == "AnonymousUser":
		return render_to_response('home/index.html', context_instance = RequestContext(request))
	else:
		return redirect('/'+str(request.user))

### Fetch Page ### / -----------------------------------------------------------------------------------------------------
def getpage(request):
	if request.method == 'GET':
		page = str(request.GET.get('page', None))
		return render_to_response(page+'.html', context_instance = RequestContext(request))


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


### POST handler to get user sessions ------------------------------------------------------------------------------------
def getuisession(request):
	if request.method == "POST":
		requsername = str(request.user)
		if requsername == 'AnonymousUser':
			return HttpResponse('')
		else:
			userobj = User.objects.get(username=requsername)
			sessioninviteobj = InvitedToSession.objects.filter(invitedUsers=userobj)
			data = 	{
						'sessioninvites': sessioninviteobj, 
					}
			return render_to_response('getsessions.html', data, context_instance = RequestContext(request))



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
		ManagedSession.objects.create(sessionName=session, sessionUser=leftuser, UserActivity="Left", Timestamp=datetime.datetime.now())

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
		ManagedSession.objects.create(sessionName=session, sessionUser=enteruser, UserActivity="Enter", Timestamp=datetime.datetime.now())

		return HttpResponse('')

### POST handler for inputting Data rates ----------------------------------------------------------------------
def storesessdata(request):
	if request.method == "POST":
		User = str(request.user)
		sessionname = str(request.POST.get('sessionname', ''))
		ToID = str(request.POST.get('ToID', ''))
		PVideoSentDR = (request.POST.get('VideoSentDR', 0))
		PVideoRecvDR = (request.POST.get('VideoRecvDR', 0))
		PAudioSentDR = (request.POST.get('AudioSentDR', 0))
		PAudioRecvDR = (request.POST.get('AudioRecvDR', 0))
		PVidDelay = (request.POST.get('VidDelay', 0))
		PAudDelay = (request.POST.get('AudDelay', 0))
		PVidPL = (request.POST.get('VidPL', 0))
		PAudPL = (request.POST.get('AudPL', 0))

		pprint(PAudioSentDR)

		if str(PVideoSentDR) is '':
			PVideoSentDR = 0
		else:
			PVideoSentDR = float(PVideoSentDR)

		if str(PVideoRecvDR) is '':
			PVideoRecvDR = 0
		else:
			PVideoRecvDR = float(PVideoRecvDR)

		if str(PAudioSentDR) is '':
			PAudioSentDR = 0
		else:
			PAudioSentDR = float(PAudioSentDR)

		if str(PAudioRecvDR) is '':
			PAudioRecvDR = 0
		else:
			PAudioRecvDR = float(PAudioRecvDR)

		SessObj = NewSession.objects.get(sessionName=sessionname)
		QoEassessment.objects.create(sessionName=SessObj, sessionUser=User, tostreamID=ToID[6:], VideoSentDR=PVideoSentDR, VideoRecvDR=PVideoRecvDR, AudioSentDR=PAudioSentDR, AudioRecvDR=PAudioRecvDR, VidPL=PVidPL, AudPL=PAudPL, VidDelay=PVidDelay, AudDelay=PAudDelay, Timestamp=datetime.datetime.now())
		return HttpResponse('')

### AnonymousUser Page -----------------------------------------------------------------------------------------
def anonredir(request):
	return redirect("/")

### POST handler for Bad QoE -----------------------------------------------------------------------------------------
def ratinghandler(request):
	if request.method == "POST":
		User = str(request.POST.get('username', ''))
		sessionname = str(request.POST.get('sessionname', ''))
		badtype = str(request.POST.get('badtype', 0))

		SessObj = NewSession.objects.get(sessionName=sessionname)
		BadAssessment.objects.create(sessionName=SessObj, sessionUser=User, RatingType=badtype, Timestamp=datetime.datetime.now())
		return HttpResponse('')

### Calculating PESQ and other Quality metrics --------------------------------------------------------------------------
def qoecalculation(request):
	if request.method == "GET":
		sessionname = str(request.GET.get('sessionname', ''))
		SessObj = NewSession.objects.get(sessionName=sessionname)

		AudioSessionAssess = BadAssessment.objects.filter(sessionName=SessObj, RatingType='A')
		
		userList = AudioSessionAssess.values_list('sessionUser').distinct()

		userOneClickDict = defaultdict(list)
		userClickDataRate = defaultdict(list)


		OneClick_ClickDataRateMAP = dict()
		OneClick_ClickDataRateMAP[0] = 45 #kbps
		OneClick_ClickDataRateMAP[1] = 30 #kbps
		OneClick_ClickDataRateMAP[2] = 22 #kbps
		OneClick_ClickDataRateMAP[3] = 13 #kbps
		OneClick_ClickDataRateMAP[4] = 5 #kbps
		OneClick_ClickDataRateMAP[5] = 0 #kbps

		for user in userList:
			uniquetimelist = []
			usertimefilt = AudioSessionAssess.objects.filter(sessionUser=user[0]) #user is a tuple
			usertimelist = usertimefilt.values_list('Timestamp')
			for itemtime in usertimelist:
				uniquetimelist.append( itemtime[0].replace(microsecond=0) )

			timelistcounter = Counter(uniquetimelist)
			timelistdatarate = []
			for key,item in timelistcounter.items():
				timelistdatarate.append( (key, OneClick_ClickDataRateMAP[item]) )

			userOneClickDict[user[0]] = timelistcounter.items()
			userClickDataRate[user[0]] = timelistdatarate.items()


		data = 	{
					'userOneClick': userOneClickDict, 
					'userClickDataRate': userClickDataRate,
				}

		return render_to_response('QoEsessAssess.html', data, context_instance = RequestContext(request))

### Registration Handling --------------------------------------------------------------------------
def register(request):
	if request.method == "POST":
		username = str(request.POST.get('username', ''))
		password = str(request.POST.get('password', ''))
		firstname = (str(request.POST.get('firstname', ''))).capitalize()
		lastname = (str(request.POST.get('lastname', ''))).capitalize()
		email = str(request.POST.get('email', ''))

		if len(password) < 7:
			return HttpResponse('Password is too short.')

		else:
			try:
				obj = User.objects.get(username=username)
				return HttpResponse('Username Exists already')
			except User.DoesNotExist:
				user = User.objects.create_user(username, email, password)
				user.first_name = firstname
				user.last_name = lastname
				user.save()
				return HttpResponse('User Profile has been created')

### Login Handling --------------------------------------------------------------------------
def userlogin(request):
	if request.method == "POST":
		username = str(request.POST.get('username', ''))
		password = str(request.POST.get('password', ''))
		user = authenticate(username=username, password=password)

		if user is not None:
			auth_login(request, user)
			return redirect('/'+username)
		else:
			return HttpResponse('Incorrect Login Parameters.')

### Login Handling --------------------------------------------------------------------------
def conferencefilter(request):
	if request.method == "GET":
		session = str(request.GET.get('sessionname', ''))
		qosdata = QoEassessment.objects.filter(sessionName__sessionName=session)
		uniqueuserlist = [i[0] for i in qosdata.values_list('sessionUser').distinct()]
		uniqueaddrlist = [i[0] for i in qosdata.values_list('tostreamID').distinct()]

		data = {
			'uniqueUsers':uniqueuserlist,
			'uniqueAddrs':uniqueaddrlist,
			'sessname':session,
		}

		return render_to_response('sessiondata.html', data, context_instance = RequestContext(request))

	else:
		session = str(request.POST.get('sessionname', ''))
		fusername = str(request.POST.get('fusername', ''))
		address = str(request.POST.get('address', ''))
		qosdata = QoEassessment.objects.filter(sessionName__sessionName=session, tostreamID=address, sessionUser=fusername)

		pprint(session)

		data = {
			'qosdata':qosdata,
		}

		return render_to_response('sessiondatatable.html', data, context_instance = RequestContext(request))