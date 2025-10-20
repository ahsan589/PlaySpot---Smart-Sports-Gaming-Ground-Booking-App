import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Table, 
  Input, 
  Select, 
  Button, 
  Tag, 
  Divider, 
  Spin, 
  Statistic, 
  Row, 
  Col, 
  Modal, 
  Image, 
  Rate,
  Space,
  Tooltip,
  Card
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  StarFilled,
  ClockCircleOutlined,
  PhoneOutlined,
  UserOutlined,
  EyeOutlined
} from "@ant-design/icons";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import type { Review } from '../types/index';

// Fix for default markers in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Pakistan default coordinates (fallback)
const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];

// Component to dynamically set map center and zoom
const MapCenterSetter: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to handle map initialization and updates
const MapController: React.FC<{ courts: any[] }> = ({ courts }) => {
  const map = useMap();
  
  useEffect(() => {
    // Force map to update its size when container changes
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [courts, map]);

  return null;
};

// Define TypeScript interfaces
interface CourtOwner {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  owner: CourtOwner;
  facilities: string[];
  pricePerHour: number;
  rating: number;
  reviews: Review[];
  status: string;
  bookings: number;
  description: string;
  contactInfo: string;
  timings: string;
  size: string;
  venueType: string;
  photos?: string[];
}

// Venue type mapping with proper labels
const VENUE_TYPE_MAPPING: { [key: string]: string } = {
  'outdoor': 'Outdoor',
  'indoor': 'Indoor',
  'gaming_arena': 'Gaming Arena',
  'sports_complex': 'Sports Complex'
};

const PakistanCourtLocator: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [venueTypeFilter, setVenueTypeFilter] = useState('all');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force map re-render

  // Function to extract coordinates from address
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'Rawalpindi': { lat: 33.5952, lng: 73.0439 },
      'Lahore': { lat: 31.5204, lng: 74.3587 },
      'Karachi': { lat: 24.8915, lng: 67.0822 },
      'Islamabad': { lat: 33.6844, lng: 73.0479 },
      'Punjab': { lat: 31.1471, lng: 75.3412 },
    };
    
    for (const city of Object.keys(cityCoordinates)) {
      if (address.includes(city)) {
        return cityCoordinates[city];
      }
    }
    
    return { lat: 33.5952, lng: 73.0439 };
  };

  // Function to extract city from address
  const extractCityFromAddress = (address: string): string => {
    const cities = ['Rawalpindi', 'Lahore', 'Karachi', 'Islamabad'];
    for (const city of cities) {
      if (address.includes(city)) {
        return city;
      }
    }
    return 'Other';
  };

  // Function to get proper venue type label
  const getVenueTypeLabel = (venueType: string): string => {
    return VENUE_TYPE_MAPPING[venueType] || venueType || 'Sports Court';
  };

  // Calculate map center based on filtered courts
  const calculateMapCenter = (): [number, number] => {
    if (filteredCourts.length === 0) return PAKISTAN_CENTER;
    
    const validCourts = filteredCourts.filter(court => 
      court.location.lat && court.location.lng
    );
    
    if (validCourts.length === 0) return PAKISTAN_CENTER;
    
    const avgLat = validCourts.reduce((sum, court) => sum + court.location.lat, 0) / validCourts.length;
    const avgLng = validCourts.reduce((sum, court) => sum + court.location.lng, 0) / validCourts.length;
    
    return [avgLat, avgLng];
  };

  // Calculate appropriate zoom level
  const calculateZoomLevel = (): number => {
    if (filteredCourts.length === 0) return 5;
    if (filteredCourts.length === 1) return 13;
    return 10;
  };

  // Fetch data from Firebase
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'grounds'));
        
        const courtsData: Court[] = [];
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          
          const address = data.address || '';
          const city = extractCityFromAddress(address);
          
          // Use exact latitude and longitude from Firebase if available, else geocode
          let lat = data.latitude;
          let lng = data.longitude;
          
          if (!lat || !lng) {
            const coords = await geocodeAddress(address);
            lat = coords.lat;
            lng = coords.lng;
          }

          // Get photos array properly - handle different possible structures
          let photos: string[] = [];
          if (Array.isArray(data.photos)) {
            photos = data.photos.filter((photo: any) => typeof photo === 'string' && photo.trim() !== '');
          } else if (typeof data.photos === 'string') {
            photos = [data.photos];
          }

          // Get venue type from database, with fallback
          const venueType = data.venueType || 'outdoor';

          courtsData.push({
            id: doc.id,
            name: data.name || 'Unnamed Court',
            location: {
              lat: lat,
              lng: lng,
              address: address,
              city: city
            },
            owner: {
              id: data.ownerId || '',
              name: data.ownerName || 'Unknown Owner',
            },
            facilities: Array.isArray(data.facilities) ? data.facilities : [],
            pricePerHour: data.price || 0,
            rating: data.rating || 0,
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            status: data.status || 'unknown',
            bookings: data.bookings || 0,
            description: data.description || '',
            contactInfo: data.contactInfo || '',
            timings: data.timings || '',
            size: data.size || '',
            venueType: venueType,
            photos: photos
          });
        }
        
        setCourts(courtsData);
        setFilteredCourts(courtsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courts:', error);
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  // Filter courts based on search and filters
  useEffect(() => {
    let result = courts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(court => 
        court.name.toLowerCase().includes(query) || 
        court.location.address.toLowerCase().includes(query) ||
        court.location.city.toLowerCase().includes(query) ||
        court.owner.name.toLowerCase().includes(query) ||
        getVenueTypeLabel(court.venueType).toLowerCase().includes(query)
      );
    }
    
    if (priceFilter !== 'all') {
      const priceRange = priceFilter.split('-').map(Number);
      result = result.filter(court => {
        if (priceRange.length === 1) {
          return court.pricePerHour >= priceRange[0];
        }
        return court.pricePerHour >= priceRange[0] && court.pricePerHour <= priceRange[1];
      });
    }
    
    if (cityFilter !== 'all') {
      result = result.filter(court => court.location.city === cityFilter);
    }

    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      result = result.filter(court => court.rating >= minRating);
    }

    if (venueTypeFilter !== 'all') {
      result = result.filter(court => court.venueType === venueTypeFilter);
    }

    setFilteredCourts(result);
    // Force map re-render when filters change
    setMapKey(prev => prev + 1);
  }, [courts, searchQuery, priceFilter, cityFilter, ratingFilter, venueTypeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriceFilter('all');
    setCityFilter('all');
    setRatingFilter('all');
    setVenueTypeFilter('all');
  };

  const showCourtDetails = (court: Court) => {
    setSelectedCourt(court);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCourt(null);
  };

  // Get unique cities for filter
  const cities = Array.from(new Set(courts.map(court => court.location.city)));

  // Get unique venue types for filter
  const venueTypes = Array.from(new Set(courts.map(court => court.venueType).filter(type => type)));

  // Calculate map center and zoom
  const mapCenter = calculateMapCenter();
  const mapZoom = calculateZoomLevel();

  // Table columns definition
  const columns = [
    {
      title: 'Court Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Court) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#4F46E5' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <EnvironmentOutlined /> {record.location.city}
          </div>
        </div>
      ),
    },
    {
      title: 'Venue Type',
      dataIndex: 'venueType',
      key: 'venueType',
      width: 120,
      render: (venueType: string) => (
        <Tag color="purple">
          {getVenueTypeLabel(venueType)}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      render: (location: Court['location']) => (
        <Tooltip title={location.address}>
          <span>{location.address.length > 30 ? `${location.address.substring(0, 30)}...` : location.address}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Price/Hour',
      dataIndex: 'pricePerHour',
      key: 'pricePerHour',
      width: 120,
      render: (price: number) => (
        <div style={{ fontWeight: 'bold', color: '#389e0d' }}>
          <DollarOutlined /> Rs. {price}
        </div>
      ),
      sorter: (a: Court, b: Court) => a.pricePerHour - b.pricePerHour,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number, record: Court) => (
        <div>
          <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
          <div style={{ fontSize: '12px', color: '#666' }}>
            ({record.reviews.length} reviews)
          </div>
        </div>
      ),
      sorter: (a: Court, b: Court) => a.rating - b.rating,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 150,
      render: (owner: CourtOwner) => (
        <div>
          <UserOutlined /> {owner.name}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'open' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Open', value: 'open' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value: any, record: Court) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Court) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => showCourtDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Contact Owner">
            <Button 
              size="small" 
              icon={<PhoneOutlined />}
              onClick={() => window.location.href = `tel:${record.contactInfo}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading courts..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        .leaflet-control-zoom a {
          background-color: #fff !important;
          color: #333 !important;
        }
      `}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#4F46E5', margin: 0, fontSize: '2.5rem' }}>
          <EnvironmentOutlined style={{ marginRight: '10px' }} />
          Sports Courts in Pakistan
        </h1>
        <p style={{ color: '#8c8c8c', margin: '5px 0 0', fontSize: '1.1rem' }}>
          Discover and book sports facilities across Pakistan
        </p>
      </div>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: '#f0f8ff', border: 'none', borderRadius: '10px' }}>
            <Statistic
              title="Total Courts"
              value={courts.length}
              prefix={<EnvironmentOutlined style={{ color: '#4F46E5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: '#f6ffed', border: 'none', borderRadius: '10px' }}>
            <Statistic
              title="Cities"
              value={cities.length}
              prefix={<EnvironmentOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: '#fffbe6', border: 'none', borderRadius: '10px' }}>
            <Statistic
              title="Venue Types"
              value={venueTypes.length}
              prefix={<EnvironmentOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: '#fff2f0', border: 'none', borderRadius: '10px' }}>
            <Statistic
              title="Avg. Rating"
              value={(courts.reduce((sum, court) => sum + court.rating, 0) / (courts.length || 1)).toFixed(1)}
              prefix={<StarFilled style={{ color: '#f5dc22ff' }} />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card style={{ marginBottom: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Search</div>
            <Input
              placeholder="Search courts, locations, cities, venue types..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px', borderRadius: '8px' }}
            />
          </div>
          
          <div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Price Range (Rs.)</div>
            <Select
              value={priceFilter}
              onChange={setPriceFilter}
              style={{ width: '200px', borderRadius: '8px' }}
            >
              <Select.Option value="all">All Prices</Select.Option>
              <Select.Option value="0-2000">Rs. 0 - 2,000</Select.Option>
              <Select.Option value="2000-4000">Rs. 2,000 - 4,000</Select.Option>
              <Select.Option value="4000-10000">Rs. 4,000 - 10,000</Select.Option>
            </Select>
          </div>
          
          <div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>City</div>
            <Select
              value={cityFilter}
              onChange={setCityFilter}
              style={{ width: '150px', borderRadius: '8px' }}
            >
              <Select.Option value="all">All Cities</Select.Option>
              {cities.map(city => (
                <Select.Option key={city} value={city}>{city}</Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Venue Type</div>
            <Select
              value={venueTypeFilter}
              onChange={setVenueTypeFilter}
              style={{ width: '150px', borderRadius: '8px' }}
            >
              <Select.Option value="all">All Types</Select.Option>
              {venueTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {getVenueTypeLabel(type)}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ fontWeight: '500', marginBottom: '5px' }}>Rating</div>
            <Select
              value={ratingFilter}
              onChange={setRatingFilter}
              style={{ width: '150px', borderRadius: '8px' }}
            >
              <Select.Option value="all">All Ratings</Select.Option>
              <Select.Option value="3">3+ Stars</Select.Option>
              <Select.Option value="4">4+ Stars</Select.Option>
              <Select.Option value="5">5 Stars</Select.Option>
            </Select>
          </div>

          <Button onClick={handleResetFilters} style={{ borderRadius: '8px' }}>
            Reset Filters
          </Button>
        </div>
      </Card>
      
      <Divider />
      
      {/* Map */}
      <Card 
        title={`Court Locations (${filteredCourts.length} courts)`} 
        style={{ marginBottom: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
        headStyle={{ fontSize: '1.2rem', fontWeight: 'bold' }}
      >
        <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <MapContainer 
            key={mapKey}
            center={mapCenter} 
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController courts={filteredCourts} />
            <MapCenterSetter center={mapCenter} zoom={mapZoom} />
            {filteredCourts.map(court => (
              <Marker
                key={court.id}
                position={[court.location.lat, court.location.lng]}
              >
                <Popup>
                  <div style={{ minWidth: '250px' }}>
                    <h4 style={{ margin: '0 0 8px' }}>{court.name}</h4>
                    <p style={{ margin: '0 0 8px' }}>{court.location.address}, {court.location.city}</p>
                    <div style={{ marginBottom: '8px' }}>
                      <UserOutlined /> Owner: {court.owner.name}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Venue Type:</strong> {getVenueTypeLabel(court.venueType)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '14px' }}>
                      <div>
                        <DollarOutlined /> Rs. {court.pricePerHour}/hour
                      </div>
                      <div>
                        <StarFilled style={{ color: '#faad14' }} /> {court.rating} ({court.reviews.length} reviews)
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => showCourtDetails(court)}
                      style={{ marginTop: '10px' }}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>
      
      {/* Courts Table */}
      <Card 
        title={`Available Courts (${filteredCourts.length})`} 
        style={{ borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
        headStyle={{ fontSize: '1.2rem', fontWeight: 'bold' }}
      >
        {filteredCourts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No courts found matching your filters</p>
            <Button onClick={handleResetFilters}>Reset Filters</Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCourts}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} courts`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>

      {/* Court Detail Modal */}
      <Modal
        title={selectedCourt?.name}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="back" onClick={handleModalClose}>
            Close
          </Button>,
          <Button 
            key="contact" 
            type="primary" 
            icon={<PhoneOutlined />}
            onClick={() => window.location.href = `tel:${selectedCourt?.contactInfo}`}
          >
            Contact Owner
          </Button>
        ]}
        width={800}
      >
        {selectedCourt && (
          <div>
            {/* Image Grid with preview */}
            {selectedCourt.photos && selectedCourt.photos.length > 0 ? (
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Image.PreviewGroup>
                  {selectedCourt.photos.map((photo, index) => (
                    <Image
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      width={120}
                      height={90}
                      style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00OCA0MkM0OCA0MS4zMzczIDQ4LjMzNzMgNDEgNDkgNDFINzFDNzEuNjYyNyA0MSA3MiA0MS4zMzczIDcyIDQyVjY4QzcyIDY4LjY2MjcgNzEuNjYyNyA2OSA3MSA2OUg0OUM0OC4zMzczIDY5IDQ4IDY4LjY2MjcgNDggNjhWNDJaIiBmaWxsPSIjREREREREIi8+CjxwYXRoIGQ9Ik01MSA1MVY1MUM1MSA1MC4zMzczIDUxLjMzNzMgNTAgNTIgNTBINjhDNjguNjYyNyA1MCA2OSA1MC4zMzczIDY5IDUxVjUxQzY5IDUxLjY2MjcgNjguNjYyNyA1MiA2OCA1Mkg1MkM1MS4zMzczIDUyIDUxIDUxLjY2MjcgNTEgNTFWNTFaIiBmaWxsPSIjREREREREIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjMiIGZpbGw9IiNEREREREQiLz4KPC9zdmc+Cg=="
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <div style={{ 
                width: '100%', 
                height: '150px', 
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999',
                marginBottom: '20px',
                borderRadius: '8px'
              }}>
                No Images Available
              </div>
            )}
            
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <h4>Venue Type</h4>
                  <Tag color="purple" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    {getVenueTypeLabel(selectedCourt.venueType)}
                  </Tag>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Location</h4>
                  <p>
                    <EnvironmentOutlined /> {selectedCourt.location.address}, {selectedCourt.location.city}
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Owner</h4>
                  <p>
                    <UserOutlined /> {selectedCourt.owner.name}
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Contact</h4>
                  <p>
                    <PhoneOutlined /> {selectedCourt.contactInfo}
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Timings</h4>
                  <p>
                    <ClockCircleOutlined /> {selectedCourt.timings}
                  </p>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <h4>Pricing</h4>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#389e0d' }}>
                    Rs. {selectedCourt.pricePerHour} per hour
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Rating & Reviews</h4>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Rate disabled defaultValue={selectedCourt.rating} />
                    <span style={{ marginLeft: '8px' }}>({selectedCourt.reviews.length} reviews)</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Size</h4>
                  <p>{selectedCourt.size}</p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4>Status</h4>
                  <Tag color={selectedCourt.status === 'open' ? 'green' : 'orange'}>
                    {selectedCourt.status.toUpperCase()}
                  </Tag>
                  <span style={{ marginLeft: '8px' }}>
                    {selectedCourt.bookings} bookings
                  </span>
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ marginBottom: '16px' }}>
              <h4>Description</h4>
              <p>{selectedCourt.description}</p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>Facilities</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedCourt.facilities.map((facility, index) => (
                  <Tag key={index} color="blue">{facility}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PakistanCourtLocator;