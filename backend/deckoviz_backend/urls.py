from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api.views import (
    AuthenticationViewSet,
    UserProfileViewSet,
    CollectionViewSet,
    AITaskViewSet
)
from api.media_views import MediaUploadViewSet
from api.gallery_views import GeneratedImageViewSet, ImageFeedbackViewSet, GalleryCollectionViewSet
from api.refinement_views import RefinementViewSet, IdeaSuggestionViewSet, DeepPromptViewSet
from api.story_views import GenerationParametersViewSet, StoryCollectionViewSet, StorySequenceViewSet
from api.memory_views import UserMemoryViewSet, MemoryEntryViewSet, CustomInstructionViewSet, PresetStyleViewSet
from api.social_views import SocialViewSet, ForumViewSet
from api.search_views import SearchViewSet, DiscoveryViewSet, SavedFiltersViewSet

router = DefaultRouter()
router.register(r'auth', AuthenticationViewSet, basename='auth')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'collections', CollectionViewSet, basename='collections')
router.register(r'ai', AITaskViewSet, basename='ai')
router.register(r'media', MediaUploadViewSet, basename='media')
router.register(r'gallery/images', GeneratedImageViewSet, basename='generated-images')
router.register(r'gallery/feedback', ImageFeedbackViewSet, basename='image-feedback')
router.register(r'gallery/collections', GalleryCollectionViewSet, basename='gallery-collections')
router.register(r'refinement', RefinementViewSet, basename='refinement')
router.register(r'suggestions', IdeaSuggestionViewSet, basename='suggestions')
router.register(r'deep-prompts', DeepPromptViewSet, basename='deep-prompts')
router.register(r'parameters', GenerationParametersViewSet, basename='parameters')
router.register(r'stories', StoryCollectionViewSet, basename='stories')
router.register(r'sequences', StorySequenceViewSet, basename='sequences')
router.register(r'memory', UserMemoryViewSet, basename='memory')
router.register(r'memory-entries', MemoryEntryViewSet, basename='memory-entries')
router.register(r'instructions', CustomInstructionViewSet, basename='instructions')
router.register(r'preset-styles', PresetStyleViewSet, basename='preset-styles')
router.register(r'social', SocialViewSet, basename='social')
router.register(r'forums', ForumViewSet, basename='forums')
router.register(r'search', SearchViewSet, basename='search')
router.register(r'discover', DiscoveryViewSet, basename='discover')
router.register(r'filters', SavedFiltersViewSet, basename='filters')

urlpatterns = [
    path('api/', include(router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


