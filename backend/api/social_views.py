from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.contrib.auth.models import User
from .models import (
    Collection, SocialShare, UserFollow, ForumPost, ForumReply, UserProfile
)
from .serializers import (
    CollectionSerializer, SocialShareSerializer, UserFollowSerializer,
    ForumPostSerializer, ForumReplySerializer, UserProfileSerializer
)


class SocialViewSet(viewsets.ViewSet):
    """Handle social features: sharing, following, trending"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='share-collection')
    def share_collection(self, request):
        """Share collection with user or make public"""
        collection_id = request.data.get('collection_id')
        share_type = request.data.get('share_type')  # 'user' | 'public' | 'link'
        recipient_email = request.data.get('recipient_email')
        can_edit = request.data.get('can_edit', False)
        
        try:
            collection = Collection.objects.get(id=collection_id, user=request.user)
        except Collection.DoesNotExist:
            return Response(
                {'error': 'Collection not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if share_type == 'public':
            collection.is_public = True
            collection.save()
            return Response({'message': 'Collection shared publicly'})
        
        elif share_type == 'user' and recipient_email:
            try:
                recipient = User.objects.get(email=recipient_email)
                share = SocialShare.objects.create(
                    collection=collection,
                    shared_by=request.user,
                    shared_with=recipient,
                    share_type='user',
                    can_edit=can_edit
                )
                collection.shares_count += 1
                collection.save()
                
                serializer = SocialShareSerializer(share)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Recipient user not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        else:
            return Response(
                {'error': 'Invalid share parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """Get collections shared with current user"""
        shares = SocialShare.objects.filter(
            shared_with=request.user,
            share_type='user'
        ).select_related('collection')
        
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        collections = [share.collection for share in shares]
        start = (page - 1) * limit
        end = start + limit
        
        serializer = CollectionSerializer(collections[start:end], many=True)
        return Response({
            'count': len(collections),
            'page': page,
            'limit': limit,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_shares(self, request):
        """Get collections I've shared"""
        shares = SocialShare.objects.filter(shared_by=request.user)
        
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        shares = shares[(page-1)*limit:page*limit]
        
        serializer = SocialShareSerializer(shares, many=True)
        return Response({
            'count': SocialShare.objects.filter(shared_by=request.user).count(),
            'page': page,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'], url_path='follow/(?P<user_id>[^/.]+)')
    def follow(self, request, user_id=None):
        """Follow a user"""
        try:
            user_to_follow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user_to_follow == request.user:
            return Response(
                {'error': 'Cannot follow yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow, created = UserFollow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            # Update follower/following counts
            user_to_follow.profile.followers_count += 1
            user_to_follow.profile.save()
            
            request.user.profile.following_count += 1
            request.user.profile.save()
        
        return Response({
            'message': 'Following user' if created else 'Already following',
            'status': 'following'
        })
    
    @action(detail=False, methods=['post'], url_path='unfollow/(?P<user_id>[^/.]+)')
    def unfollow(self, request, user_id=None):
        """Unfollow a user"""
        try:
            user_to_unfollow = User.objects.get(id=user_id)
            follow = UserFollow.objects.get(
                follower=request.user,
                following=user_to_unfollow
            )
            follow.delete()
            
            # Update counts
            user_to_unfollow.profile.followers_count -= 1
            user_to_unfollow.profile.save()
            
            request.user.profile.following_count -= 1
            request.user.profile.save()
            
            return Response({'message': 'Unfollowed user'})
        except (User.DoesNotExist, UserFollow.DoesNotExist):
            return Response(
                {'error': 'Follow relationship not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='followers/(?P<user_id>[^/.]+)?')
    def followers(self, request, user_id=None):
        """Get user's followers"""
        if not user_id:
            user = request.user
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        follows = UserFollow.objects.filter(following=user)
        
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        follows = follows[(page-1)*limit:page*limit]
        
        serializer = UserFollowSerializer(follows, many=True)
        return Response({
            'count': UserFollow.objects.filter(following=user).count(),
            'page': page,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='following/(?P<user_id>[^/.]+)?')
    def following(self, request, user_id=None):
        """Get users that user is following"""
        if not user_id:
            user = request.user
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        follows = UserFollow.objects.filter(follower=user)
        
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        follows = follows[(page-1)*limit:page*limit]
        
        serializer = UserFollowSerializer(follows, many=True)
        return Response({
            'count': UserFollow.objects.filter(follower=user).count(),
            'page': page,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='discover/trending')
    def trending(self, request):
        """Get trending collections"""
        collections = Collection.objects.filter(is_public=True).annotate(
            total_engagement=Count('likes_count') + Count('shares_count')
        ).order_by('-likes_count')[:20]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'], url_path='discover/recommended')
    def recommended(self, request):
        """Get AI-recommended collections based on user preferences"""
        profile = request.user.profile
        
        # Find collections matching user's interests and moods
        collections = Collection.objects.filter(
            is_public=True
        ).filter(
            Q(tags__in=profile.interests) |
            Q(mood__in=profile.favourite_moods) |
            Q(style__in=profile.favourite_artists)
        ).distinct()[:20]
        
        serializer = CollectionSerializer(collections, many=True)
        return Response({'results': serializer.data})


class ForumViewSet(viewsets.ModelViewSet):
    """Handle forum discussions"""
    permission_classes = [IsAuthenticated]
    serializer_class = ForumPostSerializer
    
    def get_queryset(self):
        """Return forum posts"""
        return ForumPost.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create forum post"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Reply to forum post"""
        post = self.get_object()
        
        reply = ForumReply.objects.create(
            post=post,
            user=request.user,
            content=request.data.get('content')
        )
        
        post.replies_count += 1
        post.save()
        
        serializer = ForumReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Get replies for forum post"""
        post = self.get_object()
        
        replies = post.replies.all()
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        
        replies = replies[(page-1)*limit:page*limit]
        
        serializer = ForumReplySerializer(replies, many=True)
        return Response({
            'count': post.replies.count(),
            'page': page,
            'results': serializer.data
        })
