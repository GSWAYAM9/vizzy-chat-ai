from decouple import config
from supabase import create_client, Client

class SupabaseClient:
    _instance: Client = None

    @staticmethod
    def get_client() -> Client:
        if SupabaseClient._instance is None:
            supabase_url = config("SUPABASE_URL")
            supabase_key = config("SUPABASE_KEY")
            SupabaseClient._instance = create_client(supabase_url, supabase_key)
        return SupabaseClient._instance

def get_supabase() -> Client:
    """Dependency for FastAPI endpoints"""
    return SupabaseClient.get_client()
