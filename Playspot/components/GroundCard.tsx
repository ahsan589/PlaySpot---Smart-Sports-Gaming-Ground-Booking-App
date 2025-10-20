import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateDistance, formatPrice, formatRating, getVenueTypeDisplayName, getVenueTypeIcon } from '../utils/cricketUtils';
import { ImageCarousel } from './ImageCarousel';

interface Ground {
  id: string;
  name: string;
  address: string;
  city: string;
  price: number;
  amenities: string[];
  description: string;
  contactInfo: string;
  ownerName: string;
  size: string;
  rating: number;
  reviews: number;
  photos?: string[];
  facilities: string[];
  status: string;
  latitude: number;
  longitude: number;
  venueType?: 'indoor' | 'outdoor' | 'gaming_arena' | 'sports_complex';
}

interface GroundCardProps {
  ground: Ground;
  userLocation?: any;
  onPress: (ground: Ground) => void;
  onRatePress: (ground: Ground) => void;
}

export const GroundCard: React.FC<GroundCardProps> = ({
  ground,
  userLocation,
  onPress,
  onRatePress
}) => {
  const renderDisplayStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.ratingStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.floor(rating) ? "star" : "star-outline"}
            size={size}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.groundCard}
      onPress={() => onPress(ground)}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.cardImageSection}>
        <ImageCarousel photos={ground.photos || []} groundName={ground.name} />

        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: ground.status === 'open' ? '#0a0b0a71' : '#43363561' }
        ]}>
          <Text style={styles.statusText}>{ground.status === 'open' ? 'OPEN' : 'CLOSED'}</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.cardContent}>
        {/* Rating section at the top */}
        <TouchableOpacity
          style={styles.ratingContainer}
          onPress={() => onRatePress(ground)}
          activeOpacity={0.7}
        >
          {renderDisplayStars(ground.rating, 16)}
          <View style={styles.ratingInfo}>
            <Text style={styles.ratingText}>{formatRating(ground.rating)}</Text>
            <Text style={styles.reviewsCount}>({ground.reviews})</Text>
          </View>
        </TouchableOpacity>

        {/* Ground name and price below the rating */}
        <View style={styles.namePriceRow}>
          <Text style={styles.groundName} numberOfLines={1}>{ground.name}</Text>
          <Text style={styles.groundPrice}>{formatPrice(ground.price)}/hr</Text>
        </View>

        {/* Location */}
        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.groundAddress} numberOfLines={1}>{ground.city}</Text>
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name={getVenueTypeIcon(ground.venueType || 'outdoor') as any} size={14} color="#666" />
            <Text style={styles.detailText}>{getVenueTypeDisplayName(ground.venueType || 'outdoor')}</Text>
          </View>

          {userLocation && (
            <View style={styles.detailItem}>
              <Ionicons name="navigate-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                {calculateDistance(
                  userLocation.coords.latitude,
                  userLocation.coords.longitude,
                  ground.latitude,
                  ground.longitude
                ).toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* Amenities */}
        {ground.amenities && ground.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {ground.amenities.slice(0, 2).map((amenity: string, index: number) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText} numberOfLines={1}>{amenity}</Text>
              </View>
            ))}
            {ground.amenities.length > 2 && (
              <View style={styles.moreAmenitiesChip}>
                <Text style={styles.moreAmenitiesText}>+{ground.amenities.length - 2}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groundCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    flexDirection: 'row',
    height: 160,
    minHeight: 120,
    maxHeight: 160,
  },
  cardImageSection: {
    width: '35%',
    minWidth: 100,
    maxWidth: 120,
    height: '100%',
    margin: 5,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#666',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  groundName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  groundPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groundAddress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  amenityChip: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  moreAmenitiesChip: {
    backgroundColor: '#e0e0e0',
    width: 20,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAmenitiesText: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
