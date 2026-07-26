package com.mobtrack.app;

import static org.junit.Assert.*;

import org.junit.Test;

public class NativeAppUnitTest {

    @Test
    public void testDistanceCalculation() {
        // Test straight-line distance calculation (Haversine formula helper)
        double lat1 = 41.8719; // Italy
        double lng1 = 12.5674;

        double lat2 = 41.8719; // same point
        double lng2 = 12.5674;

        double distance = calculateDistance(lat1, lng1, lat2, lng2);
        assertEquals(0.0, distance, 0.001);
    }

    @Test
    public void testDifferentPointsDistance() {
        double lat1 = 41.8719; // Rome, Italy
        double lng1 = 12.5674;

        double lat2 = 45.4642; // Milan, Italy
        double lng2 = 9.1900;

        double distance = calculateDistance(lat1, lng1, lat2, lng2);
        // Distance between Rome and Milan is approx 470 - 480 km
        assertTrue(distance > 400 && distance < 600);
    }

    @Test
    public void testGeofencingAlert() {
        double startLat = 41.8719;
        double startLng = 12.5674;

        double deviceLat = 41.8900; // very close point (within 3km)
        double deviceLng = 12.5800;

        double distanceKm = calculateDistance(startLat, startLng, deviceLat, deviceLng);
        double distanceMeters = distanceKm * 1000.0;

        double safeRadiusMeters = 5000.0; // 5km
        assertTrue("Device should be inside safe radius", distanceMeters <= safeRadiusMeters);

        double smallSafeRadiusMeters = 500.0; // 500m
        assertTrue("Device should trigger geofence alert", distanceMeters > smallSafeRadiusMeters);
    }

    // Standard Haversine distance calculator helper in kilometers
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // radius of Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
