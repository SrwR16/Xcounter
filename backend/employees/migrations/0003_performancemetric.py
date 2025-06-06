# Generated by Django 5.2.1 on 2025-05-11 09:06

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0002_create_default_departments_positions'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PerformanceMetric',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metric_date', models.DateField()),
                ('bookings_processed', models.PositiveIntegerField(default=0)),
                ('revenue_generated', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('customer_satisfaction', models.DecimalField(decimal_places=2, default=5.0, max_digits=3, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('response_time_minutes', models.PositiveIntegerField(default=0)),
                ('task_completion_rate', models.DecimalField(decimal_places=2, default=100.0, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='performance_metrics', to='employees.employeeprofile')),
                ('recorded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recorded_metrics', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-metric_date'],
                'indexes': [models.Index(fields=['employee', '-metric_date'], name='employees_p_employe_ddd988_idx'), models.Index(fields=['metric_date'], name='employees_p_metric__9890c8_idx')],
                'unique_together': {('employee', 'metric_date')},
            },
        ),
    ]
