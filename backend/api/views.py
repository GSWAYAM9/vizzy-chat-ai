from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import UserProfile, Collection, Media, AITask
from .serializers import UserProfileSerializer, CollectionSerializer, MediaSerializer, AITaskSerializer
from .authentication import GoogleOAuthHandler, TokenManager

class AuthenticationViewSet(viewsets.ViewSet):
    """Handle user authentication"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], url_path='login/google')
    def google_login(self, request):
        """Google OAuth login endpoint"""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify Google token
        idinfo = GoogleOAuthHandler.verify_google_token(token)
        if not idinfo:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Create or update user
        user = GoogleOAuthHandler.create_or_update_user(idinfo)
        
        # Generate tokens
        tokens = TokenManager.generate_tokens(user)
        
        return Response({
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'user': UserProfileSerializer(user.profile).data
        })
    
    @action(detail=False, methods=['post'], url_path='refresh-token')
    def refresh_token(self, request):
        """Refresh access token"""
        refresh_token = request.data.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tokens = TokenManager.refresh_access_token(refresh_token)
            return Response(tokens)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileViewSet(viewsets.ViewSet):
    """Handle user profile operations"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Update user profile"""
        profile = request.user.profile
        
        # Update allowed fields
        allowed_fields = ['avatar_url', 'bio', 'location', 'interests', 'favourite_artists', 'favourite_moods']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        
        profile.save()
        
        # Update user name if provided
        if 'name' in request.data:
            request.user.first_name = request.data['name']
            request.user.save()
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='public/(?P<user_id>[^/.]+)')
    def public_profile(self, request, user_id=None):
        """Get public user profile"""
        try:
            profile = UserProfile.objects.get(user_id=user_id)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def preferences(self, request):
        """Set user preferences"""
        profile = request.user.profile
        
        if 'interests' in request.data:
            profile.interests = request.data['interests']
        if 'favourite_artists' in request.data:
            profile.favourite_artists = request.data['favourite_artists']
        if 'favourite_moods' in request.data:
            profile.favourite_moods = request.data['favourite_moods']
        
        profile.save()
        
        return Response({
            'interests': profile.interests,
            'favourite_artists': profile.favourite_artists,
            'favourite_moods': profile.favourite_moods
        })
    
    @action(detail=False, methods=['get'])
    def get_preferences(self, request):
        """Get user preferences"""
        profile = request.user.profile
        
        return Response({
            'interests': profile.interests,
            'favourite_artists': profile.favourite_artists,
            'favourite_moods': profile.favourite_moods
        })


class CollectionViewSet(viewsets.ModelViewSet):
    """Handle collection operations"""
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return user's collections or public collections"""
        user = self.request.user
        if self.request.query_params.get('public'):
            return Collection.objects.filter(is_public=True)
        return Collection.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """Create collection for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media to collection"""
        collection = self.get_object()
        
        if collection.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_url = request.data.get('image_url')
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        
        media = Media.objects.create(
            collection=collection,
            image_url=image_url,
            title=title,
            description=description
        )
        
        collection.media_count += 1
        collection.save()
        
        return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def remove_media(self, request, pk=None):
        """Remove media from collection"""
        collection = self.get_object()
        
        if collection.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        media_id = request.data.get('media_id')
        
        try:
            media = Media.objects.get(id=media_id, collection=collection)
            media.delete()
            collection.media_count -= 1
            collection.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Media.DoesNotExist:
            return Response(
                {'error': 'Media not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """Favorite/star a collection"""
        collection = self.get_object()
        collection.likes_count += 1
        collection.save()
        
        return Response({'likes_count': collection.likes_count})


class AITaskViewSet(viewsets.ModelViewSet):
    """Handle AI task operations"""
    serializer_class = AITaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return current user's AI tasks"""
        return AITask.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='dream-visualizer')
    def dream_visualizer(self, request):
        """Create dream visualizer task"""
        task = AITask.objects.create(
            user=request.user,
            task_type='dream_visualizer',
            prompt=request.data.get('prompt'),
            metadata={
                'art_style': request.data.get('art_style'),
                'mood': request.data.get('mood'),
                'num_variations': request.data.get('num_variations', 1),
                'aspect_ratio': request.data.get('aspect_ratio', '16:9')
            }
        )
        
        # TODO: Queue async task to process with Runware
        # For now, mark as completed with placeholder
        
        serializer = AITaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='generate-image')
    def generate_image(self, request):
        """Generate image from prompt"""
        task = AITask.objects.create(
            user=request.user,
            task_type='image_generation',
            prompt=request.data.get('prompt'),
            metadata={
                'aspect_ratio': request.data.get('aspect_ratio', '16:9'),
                'num_results': request.data.get('num_results', 1)
            }
        )
        
        # TODO: Queue async task to process with Runware/Stability AI
        
        serializer = AITaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
