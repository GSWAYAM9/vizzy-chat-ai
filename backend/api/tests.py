"""
Comprehensive testing suite for Deckoviz Backend API
"""
import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from api.models import UserProfile, Collection, Media, AITask, UserFollow, SocialShare
from api.authentication import TokenManager


class AuthenticationTestCase(APITestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)
    
    def test_generate_tokens(self):
        """Test JWT token generation"""
        tokens = TokenManager.generate_tokens(self.user)
        self.assertIn('access_token', tokens)
        self.assertIn('refresh_token', tokens)
        self.assertEqual(tokens['token_type'], 'Bearer')
    
    def test_refresh_token(self):
        """Test token refresh"""
        tokens = TokenManager.generate_tokens(self.user)
        new_tokens = TokenManager.refresh_access_token(tokens['refresh_token'])
        self.assertIn('access_token', new_tokens)
        self.assertNotEqual(tokens['access_token'], new_tokens['access_token'])


class UserProfileTestCase(APITestCase):
    """Test user profile endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.tokens = TokenManager.generate_tokens(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access_token']}")
    
    def test_get_current_profile(self):
        """Test getting current user profile"""
        response = self.client.get('/api/profile/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], 'testuser@example.com')
    
    def test_update_profile(self):
        """Test updating user profile"""
        data = {
            'bio': 'Updated bio',
            'location': 'New York',
            'interests': ['photography', 'design']
        }
        response = self.client.patch('/api/profile/update_profile/', data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['bio'], 'Updated bio')
    
    def test_get_preferences(self):
        """Test getting user preferences"""
        response = self.client.get('/api/profile/get_preferences/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('interests', response.data)
    
    def test_set_preferences(self):
        """Test setting user preferences"""
        data = {
            'interests': ['art', 'photography'],
            'favourite_artists': ['Picasso', 'Monet'],
            'favourite_moods': ['inspiration', 'calm']
        }
        response = self.client.post('/api/profile/preferences/', data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['interests'], ['art', 'photography'])


class CollectionTestCase(APITestCase):
    """Test collection endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.tokens = TokenManager.generate_tokens(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access_token']}")
    
    def test_create_collection(self):
        """Test creating a collection"""
        data = {
            'title': 'Test Collection',
            'description': 'A test collection',
            'mood': 'inspiration',
            'style': 'abstract',
            'is_public': True,
            'tags': ['test', 'sample']
        }
        response = self.client.post('/api/collections/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'Test Collection')
    
    def test_list_collections(self):
        """Test listing user's collections"""
        Collection.objects.create(
            user=self.user,
            title='Test Collection',
            is_public=True
        )
        response = self.client.get('/api/collections/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_get_collection(self):
        """Test getting collection details"""
        collection = Collection.objects.create(
            user=self.user,
            title='Test Collection'
        )
        response = self.client.get(f'/api/collections/{collection.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Test Collection')
    
    def test_update_collection(self):
        """Test updating collection"""
        collection = Collection.objects.create(
            user=self.user,
            title='Test Collection'
        )
        data = {'title': 'Updated Collection', 'mood': 'calm'}
        response = self.client.patch(f'/api/collections/{collection.id}/', data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Updated Collection')
    
    def test_delete_collection(self):
        """Test deleting collection"""
        collection = Collection.objects.create(
            user=self.user,
            title='Test Collection'
        )
        response = self.client.delete(f'/api/collections/{collection.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Collection.objects.filter(id=collection.id).exists())
    
    def test_add_media_to_collection(self):
        """Test adding media to collection"""
        collection = Collection.objects.create(
            user=self.user,
            title='Test Collection'
        )
        data = {
            'image_url': 'https://example.com/image.jpg',
            'title': 'Test Image',
            'description': 'Test image description'
        }
        response = self.client.post(f'/api/collections/{collection.id}/add_media/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(collection.media.count(), 1)


class AITaskTestCase(APITestCase):
    """Test AI feature endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.tokens = TokenManager.generate_tokens(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access_token']}")
    
    def test_dream_visualizer(self):
        """Test dream visualizer endpoint"""
        data = {
            'prompt': 'A serene mountain landscape',
            'art_style': 'impressionist',
            'mood': 'calm',
            'num_variations': 1,
            'aspect_ratio': '16:9'
        }
        response = self.client.post('/api/ai/dream-visualizer/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['task_type'], 'dream_visualizer')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_generate_image(self):
        """Test image generation endpoint"""
        data = {
            'prompt': 'A futuristic city',
            'aspect_ratio': '16:9',
            'num_results': 1
        }
        response = self.client.post('/api/ai/generate-image/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['task_type'], 'image_generation')
    
    def test_list_ai_tasks(self):
        """Test listing AI tasks"""
        AITask.objects.create(
            user=self.user,
            task_type='dream_visualizer',
            prompt='Test prompt'
        )
        response = self.client.get('/api/ai/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)


class SocialTestCase(APITestCase):
    """Test social features"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='pass123'
        )
        self.user2 = User.objects.create_user(
            username='user2@example.com',
            email='user2@example.com',
            password='pass123'
        )
        self.profile1 = UserProfile.objects.create(user=self.user1)
        self.profile2 = UserProfile.objects.create(user=self.user2)
        self.tokens1 = TokenManager.generate_tokens(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens1['access_token']}")
    
    def test_follow_user(self):
        """Test following a user"""
        response = self.client.post(f'/api/social/follow/{self.user2.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(UserFollow.objects.filter(
            follower=self.user1,
            following=self.user2
        ).exists())
    
    def test_unfollow_user(self):
        """Test unfollowing a user"""
        UserFollow.objects.create(follower=self.user1, following=self.user2)
        response = self.client.post(f'/api/social/unfollow/{self.user2.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(UserFollow.objects.filter(
            follower=self.user1,
            following=self.user2
        ).exists())
    
    def test_share_collection(self):
        """Test sharing a collection"""
        collection = Collection.objects.create(
            user=self.user1,
            title='Test Collection'
        )
        data = {
            'collection_id': str(collection.id),
            'share_type': 'user',
            'recipient_email': 'user2@example.com',
            'can_edit': False
        }
        response = self.client.post('/api/social/share-collection/', data)
        self.assertEqual(response.status_code, 201)


class SearchTestCase(APITestCase):
    """Test search functionality"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)
        
        # Create test collections
        Collection.objects.create(
            user=self.user,
            title='Abstract Art',
            description='Beautiful abstract artwork',
            style='abstract',
            mood='inspiration',
            is_public=True,
            tags=['abstract', 'art']
        )
    
    def test_search_collections(self):
        """Test searching collections"""
        response = self.client.get('/api/search/collections/?q=abstract')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
    
    def test_discover_by_mood(self):
        """Test discovering by mood"""
        response = self.client.get('/api/discover/by-mood/inspiration')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['mood'], 'inspiration')
    
    def test_trending_collections(self):
        """Test getting trending collections"""
        response = self.client.get('/api/discover/trending')
        self.assertEqual(response.status_code, 200)


# Postman-style test collection
POSTMAN_COLLECTION = {
    "info": {
        "name": "Deckoviz Backend API",
        "description": "Complete API testing collection for Deckoviz mobile backend",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Authentication",
            "item": [
                {
                    "name": "Google OAuth Login",
                    "request": {
                        "method": "POST",
                        "url": "{{base_url}}/api/auth/login/google/",
                        "body": {"raw": '{"token": "google_oauth_token"}'}
                    }
                },
                {
                    "name": "Refresh Token",
                    "request": {
                        "method": "POST",
                        "url": "{{base_url}}/api/auth/refresh-token/",
                        "body": {"raw": '{"refresh_token": "your_refresh_token"}'}
                    }
                }
            ]
        },
        {
            "name": "User Profile",
            "item": [
                {
                    "name": "Get Current Profile",
                    "request": {
                        "method": "GET",
                        "url": "{{base_url}}/api/profile/profile/",
                        "header": [{"key": "Authorization", "value": "Bearer {{access_token}}"}]
                    }
                },
                {
                    "name": "Update Profile",
                    "request": {
                        "method": "PATCH",
                        "url": "{{base_url}}/api/profile/update_profile/",
                        "header": [{"key": "Authorization", "value": "Bearer {{access_token}}"}],
                        "body": {"raw": '{"bio": "Updated bio", "interests": ["art"]}'}
                    }
                }
            ]
        }
    ]
}
