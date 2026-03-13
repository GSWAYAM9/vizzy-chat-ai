from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Count
from django.contrib.auth.models import User
from .models import Collection, UserProfile, Media, ForumPost
from .serializers import CollectionSerializer, UserProfileSerializer, ForumPostSerializer


class SearchViewSet(viewsets.ViewSet):
    """Handle search functionality"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='collections')
    def search_collections(self, request):
        """Search collections by title, description, tags"""
        query = request.query_params.get('q', '')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        sort_by = request.query_params.get('sort_by', 'recent')  # recent | trending | popular
        
        collections = Collection.objects.filter(is_public=True).filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(tags__icontains=query)
        )
        
        # Apply sorting
        if sort_by == 'trending':
            collections = collections.order_by('-likes_count')
        elif sort_by == 'popular':
            collections = collections.order_by('-shares_count')
        else:
            collections = collections.order_by('-created_at')
        
        # Paginate
        total_count = collections.count()
        collections = collections[(page-1)*limit:page*limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({
            'count': total_count,
            'page': page,
            'limit': limit,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='users')
    def search_users(self, request):
        """Search users by name or email"""
        query = request.query_params.get('q', '')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(email__icontains=query)
        ).select_related('profile')
        
        total_count = users.count()
        users = users[(page-1)*limit:page*limit]
        
        profiles = [user.profile for user in users]
        serializer = UserProfileSerializer(profiles, many=True)
        
        return Response({
            'count': total_count,
            'page': page,
            'limit': limit,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='artworks')
    def search_artworks(self, request):
        """Search artworks by tags, style"""
        tags = request.query_params.getlist('tags')
        style = request.query_params.get('style', '')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        medias = Media.objects.filter(
            collection__is_public=True
        )
        
        if tags:
            for tag in tags:
                medias = medias.filter(collection__tags__icontains=tag)
        
        if style:
            medias = medias.filter(collection__style__icontains=style)
        
        total_count = medias.count()
        medias = medias.order_by('-created_at')[(page-1)*limit:page*limit]
        
        results = []
        for media in medias:
            results.append({
                'id': str(media.id),
                'image_url': media.image_url,
                'title': media.title,
                'collection': {
                    'id': str(media.collection.id),
                    'title': media.collection.title,
                    'style': media.collection.style,
                    'mood': media.collection.mood
                }
            })
        
        return Response({
            'count': total_count,
            'page': page,
            'limit': limit,
            'results': results
        })


class DiscoveryViewSet(viewsets.ViewSet):
    """Handle content discovery"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        """Get trending collections"""
        limit = int(request.query_params.get('limit', 20))
        
        collections = Collection.objects.filter(is_public=True).order_by(
            '-likes_count', '-shares_count'
        )[:limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'], url_path='recommended')
    def recommended(self, request):
        """Get AI-recommended collections (requires auth)"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = request.user.profile
        limit = int(request.query_params.get('limit', 20))
        
        # Find collections matching user's interests
        collections = Collection.objects.filter(is_public=True).filter(
            Q(tags__in=profile.interests) |
            Q(mood__in=profile.favourite_moods) |
            Q(style__in=profile.favourite_artists)
        ).distinct().order_by('-created_at')[:limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'], url_path='by-mood/(?P<mood>[^/.]+)')
    def by_mood(self, request, mood=None):
        """Discover collections by mood"""
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        collections = Collection.objects.filter(
            is_public=True,
            mood__iexact=mood
        ).order_by('-created_at')
        
        total_count = collections.count()
        collections = collections[(page-1)*limit:page*limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({
            'count': total_count,
            'page': page,
            'limit': limit,
            'mood': mood,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='by-style/(?P<style>[^/.]+)')
    def by_style(self, request, style=None):
        """Discover collections by art style"""
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        collections = Collection.objects.filter(
            is_public=True,
            style__iexact=style
        ).order_by('-created_at')
        
        total_count = collections.count()
        collections = collections[(page-1)*limit:page*limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({
            'count': total_count,
            'page': page,
            'limit': limit,
            'style': style,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='explore')
    def explore(self, request):
        """Random exploration endpoint - get random public collections"""
        limit = int(request.query_params.get('limit', 20))
        
        collections = Collection.objects.filter(is_public=True).order_by('?')[:limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """Get featured collections (high engagement)"""
        limit = int(request.query_params.get('limit', 20))
        
        collections = Collection.objects.filter(is_public=True).order_by(
            '-likes_count'
        ).filter(likes_count__gte=5)[:limit]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})


class SavedFiltersViewSet(viewsets.ViewSet):
    """Handle saved search filters"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # In production, this would use a SavedFilter model
        self.saved_filters = {}
    
    @action(detail=False, methods=['post'])
    def create_filter(self, request):
        """Save a search filter"""
        filter_name = request.data.get('name')
        filters = request.data.get('filters')
        
        user_id = request.user.id
        
        if user_id not in self.saved_filters:
            self.saved_filters[user_id] = []
        
        saved_filter = {
            'id': len(self.saved_filters[user_id]) + 1,
            'name': filter_name,
            'filters': filters,
            'created_at': str(request.user.profile.created_at)
        }
        
        self.saved_filters[user_id].append(saved_filter)
        
        return Response(saved_filter, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_filters(self, request):
        """Get user's saved filters"""
        user_id = request.user.id
        
        filters = self.saved_filters.get(user_id, [])
        
        return Response({
            'count': len(filters),
            'results': filters
        })
