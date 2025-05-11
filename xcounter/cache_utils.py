"""
Cache utilities for the application.
"""

import hashlib
from functools import wraps

from django.core.cache import cache, caches
from django.utils.encoding import force_str


def generate_cache_key(prefix, *args, **kwargs):
    """
    Generate a cache key based on the prefix and the arguments.

    Args:
        prefix: A string prefix for the cache key
        *args: Any positional arguments to include in the key
        **kwargs: Any keyword arguments to include in the key

    Returns:
        A string cache key
    """
    # Convert all arguments to a string representation
    args_str = [force_str(arg) for arg in args]
    kwargs_str = [f"{force_str(k)}:{force_str(v)}" for k, v in sorted(kwargs.items())]

    # Create a unique string combining all arguments
    key_components = [prefix] + args_str + kwargs_str
    key_string = ":".join(key_components)

    # For very long keys, use a hash to ensure the key is not too long
    if len(key_string) > 250:
        key_string = f"{prefix}:hash:{hashlib.md5(key_string.encode()).hexdigest()}"

    return key_string


def cached_property(timeout=300, key_prefix=None):
    """
    A decorator that converts a method with a single self argument into a
    property cached on the instance for the specified timeout.

    Args:
        timeout: Time in seconds to cache the result (default: 300)
        key_prefix: Optional prefix for the cache key (default: None)

    Returns:
        A cached property
    """

    def decorator(method):
        @wraps(method)
        def wrapped(self):
            # Generate cache key
            prefix = key_prefix or f"{self.__class__.__name__}.{method.__name__}"
            cache_key = f"{prefix}:{self.pk}"

            # Try to get from cache
            result = cache.get(cache_key)
            if result is None:
                # Not in cache, call the method
                result = method(self)
                # Cache the result
                cache.set(cache_key, result, timeout)
            return result

        return property(wrapped)

    return decorator


def cache_view(key_func=None, timeout=300, cache_alias="default"):
    """
    A decorator to cache a function based on the request and arguments.

    Args:
        key_func: A function that takes the same arguments as the decorated function
                  and returns a cache key. If None, a default key is generated.
        timeout: Time in seconds to cache the result (default: 300)
        cache_alias: The cache to use (default: 'default')

    Returns:
        A decorator that caches the function result
    """

    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                prefix = f"{func.__module__}.{func.__name__}"
                cache_key = generate_cache_key(prefix, *args, **kwargs)

            # Get the cache
            cache_backend = caches[cache_alias]

            # Try to get from cache
            result = cache_backend.get(cache_key)
            if result is None:
                # Not in cache, call the function
                result = func(*args, **kwargs)
                # Cache the result
                cache_backend.set(cache_key, result, timeout)
            return result

        return wrapped

    return decorator


def cache_queryset(timeout=300, cache_alias="default"):
    """
    A decorator to cache a queryset method.

    Args:
        timeout: Time in seconds to cache the result (default: 300)
        cache_alias: The cache to use (default: 'default')

    Returns:
        A decorator that caches the queryset result
    """

    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            # Generate cache key
            prefix = f"{func.__module__}.{func.__name__}"
            cache_key = generate_cache_key(prefix, *args, **kwargs)

            # Get the cache
            cache_backend = caches[cache_alias]

            # Try to get from cache
            result = cache_backend.get(cache_key)
            if result is None:
                # Not in cache, call the function
                queryset = func(*args, **kwargs)
                # Cache the result as a list
                result = list(queryset)
                cache_backend.set(cache_key, result, timeout)
            return result

        return wrapped

    return decorator


def clear_model_cache(model, pk=None):
    """
    Clear all cache keys related to a specific model or instance.

    Args:
        model: The model class
        pk: Optional primary key of a specific instance (default: None)
    """
    model_name = model.__name__

    # Pattern matching for model-related keys
    pattern = f"{model_name}.*"
    if pk:
        pattern = f"{model_name}.*:{pk}"

    # Find and delete matching keys
    # Note: This is an approximation as Django's cache backends
    # don't all support pattern-based key deletion

    # For file-based cache, we can at least clear specific keys we know about
    if pk:
        # Clear known instance-related cache keys
        for cached_method in ["get_absolute_url", "get_admin_url", "get_display_name"]:
            cache_key = f"{model_name}.{cached_method}:{pk}"
            cache.delete(cache_key)
    else:
        # For whole model clearing, we rely on cache timeout
        # or could implement a registry of keys per model if needed
        pass
