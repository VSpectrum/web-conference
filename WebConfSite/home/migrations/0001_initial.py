# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InvitedToSession',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('invitedUsers', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='ManagedSession',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('sessionUser', models.CharField(max_length=50)),
                ('UserActivity', models.CharField(max_length=5, choices=[(b'Enter', b'Entered'), (b'Left', b'Left')])),
                ('TimeActivity', models.DateTimeField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='NewSession',
            fields=[
                ('sessionID', models.AutoField(unique=True, serialize=False, primary_key=True)),
                ('sessionName', models.CharField(max_length=33)),
                ('sessionPrivate', models.BooleanField(default=False)),
                ('dateTCreated', models.DateTimeField(auto_now_add=True)),
                ('sessionHost', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='QoEassessment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('VideoQuality', models.CharField(max_length=2)),
                ('sessionName', models.ForeignKey(to='home.NewSession')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='managedsession',
            name='sessionName',
            field=models.ForeignKey(to='home.NewSession'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='invitedtosession',
            name='sessionName',
            field=models.ForeignKey(to='home.NewSession'),
            preserve_default=True,
        ),
    ]
