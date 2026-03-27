import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface NewsCardProps {
  title: string;
  description: string;
  imageUrl?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ title, description, imageUrl }) => {
  return (
    <View
      style={[globalStyles.card, styles.container]}
      accessible={true}
      accessibilityLabel={title}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          accessibilityLabel={`Image for ${title}`}
        />
      )}
      <Text style={[globalStyles.bodyText, styles.title]}>{title}</Text>
      <Text style={[globalStyles.secondaryText, styles.description]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
  },
});

export default NewsCard;