from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    AuthenticationViewSet,
    UserProfileViewSet,
    CollectionViewSet,
    AITaskViewSet
)
from api.social_views import SocialViewSet, ForumViewSet
from api.search_views import SearchViewSet, DiscoveryViewSet, SavedFiltersViewSet

router = DefaultRouter()
router.register(r'auth', AuthenticationViewSet, basename='auth')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'collections', CollectionViewSet, basename='collections')
router.register(r'ai', AITaskViewSet, basename='ai')
router.register(r'social', SocialViewSet, basename='social')
router.register(r'forums', ForumViewSet, basename='forums')
router.register(r'search', SearchViewSet, basename='search')
router.register(r'discover', DiscoveryViewSet, basename='discover')
router.register(r'filters', SavedFiltersViewSet, basename='filters')

urlpatterns = [
    path('api/', include(router.urls)),
]
