# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ManagedSessions',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='NewSession',
            fields=[
                ('sessionID', models.AutoField(unique=True, serialize=False, primary_key=True)),
                ('sessionType', models.CharField(max_length=3, choices=[(b'P2P', b'Peer-to-Peer'), (b'S2C', b'Server-to-Clients')])),
                ('dateTCreated', models.DateTimeField(auto_now_add=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('email', models.CharField(unique=True, max_length=80)),
                ('firstname', models.CharField(max_length=50)),
                ('lastname', models.CharField(max_length=50)),
                ('status', models.CharField(max_length=10, choices=[(b'Online', b'User is active'), (b'Away', b'User is away from computer'), (b'Offline', b'User is not available'), (b'Invisible', b'User is not available')])),
                ('invitedsessions', models.ForeignKey(to='home.NewSession')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='newsession',
            name='sessionHost',
            field=models.ForeignKey(to='home.User'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='managedsessions',
            name='MSinvitedusers',
            field=models.ForeignKey(to='home.User'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='managedsessions',
            name='MSsessionID',
            field=models.ForeignKey(to='home.NewSession'),
            preserve_default=True,
        ),
    ]
