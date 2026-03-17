#!/usr/bin/env python3
"""
Backend API Testing Script
Quick tests to verify all endpoints are working
"""

import requests
import json
import sys
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"
TOKEN: Optional[str] = None

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def test_health():
    """Test health check endpoint"""
    print_header("Testing Health Check")
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        if response.status_code == 200:
            print_success("Health check passed")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Connection error: {e}")
        return False

def test_register():
    """Test user registration"""
    global TOKEN
    print_header("Testing User Registration")
    
    data = {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "username": "test_user"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        
        if response.status_code == 200:
            result = response.json()
            TOKEN = result.get('access_token')
            print_success("Registration successful")
            print(f"Token: {TOKEN[:50]}...")
            return True
        else:
            print_error(f"Registration failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_login():
    """Test user login"""
    global TOKEN
    print_header("Testing User Login")
    
    data = {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        
        if response.status_code == 200:
            result = response.json()
            TOKEN = result.get('access_token')
            print_success("Login successful")
            print(f"Token: {TOKEN[:50]}...")
            return True
        else:
            print_error(f"Login failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_get_profile():
    """Test get current user profile"""
    print_header("Testing Get Current User")
    
    if not TOKEN:
        print_error("No token available. Run register or login first.")
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Got user profile")
            print(json.dumps(result, indent=2))
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_image_history():
    """Test get image history"""
    print_header("Testing Image History")
    
    if not TOKEN:
        print_error("No token available")
        return False
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.get(f"{BASE_URL}/images/history?limit=10", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Retrieved {len(result)} images")
            if result:
                print(json.dumps(result[0], indent=2))
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_gallery():
    """Test gallery endpoints"""
    print_header("Testing Gallery Operations")
    
    if not TOKEN:
        print_error("No token available")
        return False
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get gallery
        response = requests.get(f"{BASE_URL}/gallery", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Retrieved {len(result)} gallery items")
            if result:
                print(json.dumps(result[0], indent=2))
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_api_docs():
    """Test API documentation endpoint"""
    print_header("Testing API Documentation")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/docs")
        
        if response.status_code == 200:
            print_success("API docs available at /docs")
            return True
        else:
            print_error(f"Docs not available: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("  Vizzy Chat AI - Backend API Test Suite")
    print("="*60)
    
    tests = [
        ("Health Check", test_health),
        ("API Documentation", test_api_docs),
        ("User Registration", test_register),
        ("User Profile", test_get_profile),
        ("Image History", test_image_history),
        ("Gallery Management", test_gallery),
        ("User Login", test_login),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Unexpected error in {test_name}: {e}")
            results.append((test_name, False))
    
    # Print summary
    print_header("Test Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print_success("All tests passed!")
        return 0
    else:
        print_error(f"{total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    print_info("Make sure the backend is running: python main.py")
    print_info(f"Testing against: {BASE_URL}\n")
    
    sys.exit(run_all_tests())
