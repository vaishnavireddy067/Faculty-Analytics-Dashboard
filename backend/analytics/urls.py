from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('export/pdf/', views.export_pdf, name='export_pdf'),
    path('export/excel/', views.export_excel, name='export_excel'),
    path('export/compliance/<str:report_type>/', views.export_compliance, name='export_compliance'),
    path('export/appraisal/', views.export_appraisal, name='export_appraisal'),
    path('ai-insights/', views.ai_insights, name='ai_insights'),
]
