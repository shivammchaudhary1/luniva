import { Image, StyleSheet, View } from 'react-native';

type BrandLogoProps = {
  size?: number;
};

const logoSource = require('../../assets/branding/luniva-logo.png');

export function BrandLogo({ size = 180 }: BrandLogoProps) {
  return (
    <View
      accessibilityLabel="Luniva"
      accessibilityRole="image"
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image resizeMode="contain" source={logoSource} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
