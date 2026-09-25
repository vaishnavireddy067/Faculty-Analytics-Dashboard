from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicationViewSet, PatentViewSet, BookViewSet, FdpTrainingViewSet,
    ConsultancyViewSet, GrantViewSet, CertificationViewSet, StudentGuidanceViewSet, ActivityViewSet,
    StudentProjectViewSet, FacultyExpertiseViewSet, NotificationViewSet, BadgeViewSet,
    FacultyGoalViewSet, FacultyTimelineViewSet, DiscussionPostViewSet, ResearchAssetViewSet,
    FacultyRoleViewSet, CertificateViewSet, consolidated_report, download_certificate_bundle,
    faculty_profile, faculty_settings, export_cv, analyze_feedback, plagiarism_scan,
    ai_predict, ai_copilot, ai_trends, voice_parse, document_verify, test_gemini_key, ai_status,
    analytics_ranking, admin_dashboard,
    growth_score, team_builder, publication_impact, research_map, accreditation_package,
    newsletter_generator, skill_gap, funding_finder, workload_analyzer, student_impact,
    department_health, department_competition, document_checker, executive_dashboard,
    recommend_journals, recommend_conferences, patent_detector, predict_success, generate_proposal,
    superadmin_dashboard, collaboration_network, department_heatmap,
    sync_external_profiles, leaderboard, mentorship_projects,
    student_feedback_analysis,
    fetch_doi_metadata, parse_certificate_ai, naac_ssr_criterion3,
    calculate_pbas_score, audit_logs_list, department_radar_comparison,
    bulk_import_activities, system_health_check,
    iqac_monthly_report_data, export_iqac_excel,
    iqac_reports_list, iqac_delete_report
)

router = DefaultRouter()
router.register(r'publications', PublicationViewSet)
router.register(r'patents', PatentViewSet)
router.register(r'books', BookViewSet)
router.register(r'fdp-training', FdpTrainingViewSet)
router.register(r'consultancy', ConsultancyViewSet)
router.register(r'grants', GrantViewSet)
router.register(r'certifications', CertificationViewSet)
router.register(r'student-guidance', StudentGuidanceViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'student-projects', StudentProjectViewSet)
router.register(r'expertise', FacultyExpertiseViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'badges', BadgeViewSet)
router.register(r'goals', FacultyGoalViewSet)
router.register(r'timeline', FacultyTimelineViewSet)
router.register(r'forum-posts', DiscussionPostViewSet)
router.register(r'repository', ResearchAssetViewSet)
router.register(r'roles', FacultyRoleViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('profile/', faculty_profile, name='faculty_profile'),
    path('profile/export_cv/', export_cv, name='export_cv'),
    path('settings/', faculty_settings, name='faculty_settings'),
    
    # Reports & Downloads
    path('reports/consolidated/', consolidated_report, name='consolidated_report'),
    path('reports/naac-ssr-criterion3/', naac_ssr_criterion3, name='naac_ssr_criterion3'),
    path('reports/iqac-monthly/', iqac_monthly_report_data, name='iqac_monthly_report_data'),
    path('reports/iqac-monthly/list/', iqac_reports_list, name='iqac_reports_list'),
    path('reports/iqac-monthly/<int:pk>/delete/', iqac_delete_report, name='iqac_delete_report'),
    path('reports/iqac-monthly/export-excel/', export_iqac_excel, name='export_iqac_excel'),
    path('certificates/download-zip/', download_certificate_bundle, name='download_certificate_bundle'),
    
    # Smart Data Entry Helpers
    path('fetch-doi/', fetch_doi_metadata, name='fetch_doi_metadata'),
    path('ai/parse-certificate/', parse_certificate_ai, name='parse_certificate_ai'),

    # AI & Advanced Endpoints
    path('ai/predict/', ai_predict, name='ai_predict'),
    path('ai/copilot/', ai_copilot, name='ai_copilot'),
    path('ai/trends/', ai_trends, name='ai_trends'),
    path('ai/voice-parse/', voice_parse, name='voice_parse'),
    path('ai/analyze-feedback/', analyze_feedback, name='analyze_feedback'),
    path('ai/plagiarism-scan/', plagiarism_scan, name='plagiarism_scan'),
    path('document/verify/', document_verify, name='document_verify'),
    path('analytics/ranking/', analytics_ranking, name='analytics_ranking'),
    path('analytics/network/', collaboration_network, name='collaboration_network'),
    path('admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('superadmin/dashboard/', superadmin_dashboard, name='superadmin_dashboard'),
    
    # New Phase 1 AI Endpoints
    path('ai/recommend-journals/', recommend_journals, name='recommend_journals'),
    path('ai/recommend-conferences/', recommend_conferences, name='recommend_conferences'),
    path('ai/patent-detector/', patent_detector, name='patent_detector'),
    path('ai/predict-success/', predict_success, name='predict_success'),
    path('ai/generate-proposal/', generate_proposal, name='generate_proposal'),
    path('profile/sync-external/', sync_external_profiles, name='sync_external_profiles'),
    
    # 20 Features endpoints
    path('growth-score/', growth_score, name='growth_score'),
    path('team-builder/', team_builder, name='team_builder'),
    path('impact/', publication_impact, name='publication_impact'),
    path('map/', research_map, name='research_map'),
    path('accreditation/', accreditation_package, name='accreditation_package'),
    path('newsletter/', newsletter_generator, name='newsletter_generator'),
    path('skill-gap/', skill_gap, name='skill_gap'),
    path('funding-finder/', funding_finder, name='funding_finder'),
    path('workload/', workload_analyzer, name='workload_analyzer'),
    path('student-impact/', student_impact, name='student_impact'),
    path('department-health/', department_health, name='department_health'),
    path('department-competition/', department_competition, name='department_competition'),
    path('department-heatmap/', department_heatmap, name='department_heatmap'),
    path('document-checker/', document_checker, name='document_checker'),
    path('executive-dashboard/', executive_dashboard, name='executive_dashboard'),
    path('analytics/leaderboard/', leaderboard, name='leaderboard'),
    path('mentorship/projects/', mentorship_projects, name='mentorship_projects'),
    path('analytics/feedback/', student_feedback_analysis, name='student_feedback_analysis'),
    path('pbas-score/', calculate_pbas_score, name='calculate_pbas_score'),
    path('audit-logs/', audit_logs_list, name='audit_logs_list'),
    path('department-comparison/', department_radar_comparison, name='department_radar_comparison'),
    path('bulk-import/', bulk_import_activities, name='bulk_import_activities'),
    path('health/', system_health_check, name='system_health_check'),

    path('', include(router.urls)),
]

