from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from supabase import create_client
from decouple import config
import json

# Initialize Supabase client
supabase = create_client(config('SUPABASE_URL'), config('SUPABASE_KEY'))

@require_http_methods(["GET"])
def analytics(request):
    """Get system analytics and metrics"""
    try:
        # Get user count
        users_response = supabase.table("users").select("id").execute()
        total_users = len(users_response.data)
        
        # Get total images
        images_response = supabase.table("images").select("id").execute()
        total_images = len(images_response.data)
        
        # Get completed batch jobs
        jobs_response = supabase.table("batch_jobs")\
            .select("id")\
            .eq("status", "completed")\
            .execute()
        completed_jobs = len(jobs_response.data)
        
        return JsonResponse({
            'total_users': total_users,
            'total_images': total_images,
            'completed_jobs': completed_jobs,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def users_list(request):
    """Get list of users with stats"""
    try:
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        # Get users
        users_response = supabase.table("users")\
            .select("id, email, username, created_at")\
            .range(offset, offset + limit)\
            .execute()
        
        users_data = []
        for user in users_response.data:
            # Count user's images
            images = supabase.table("images")\
                .select("id")\
                .eq("user_id", user['id'])\
                .execute()
            
            users_data.append({
                'id': user['id'],
                'email': user['email'],
                'username': user['username'],
                'image_count': len(images.data),
                'created_at': user['created_at'],
            })
        
        return JsonResponse({
            'users': users_data,
            'total': len(users_response.data),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def jobs_list(request):
    """Get list of batch jobs"""
    try:
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        # Get batch jobs
        jobs_response = supabase.table("batch_jobs")\
            .select("*")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit)\
            .execute()
        
        jobs_data = [
            {
                'id': job['id'],
                'job_name': job['job_name'],
                'status': job['status'],
                'total_images': job['total_images'],
                'generated_images': job['generated_images'],
                'failed_images': job['failed_images'],
                'created_at': job['created_at'],
                'completed_at': job['completed_at'],
            }
            for job in jobs_response.data
        ]
        
        return JsonResponse({
            'jobs': jobs_data,
            'total': len(jobs_response.data),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
