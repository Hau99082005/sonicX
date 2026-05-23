import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { createAudio, updateAudio, Audio } from '@api/music';
import Toast from 'react-native-toast-message';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
};

const CATEGORIES = [
  "Arts", "Business", "Education", "Entertainment", "Kids & Family", "Music", "Science", "Tech", "Others"
];

const AudioForm = ({ route, navigation }: any) => {
  const audio = route.params?.audio as Audio | undefined;
  const isEdit = !!audio;

  const [title, setTitle] = useState(audio?.title || '');
  const [about, setAbout] = useState(audio?.about || '');
  const [category, setCategory] = useState(audio?.category || 'Music');
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedPoster, setSelectedPoster] = useState<any>(null);

  const pickAudioFile = async () => {
    try {
      const [res] = await pick({
        type: [types.audio],
      });
      setSelectedFile(res);
    } catch (err) {
      if (isErrorWithCode(err) && err.code !== errorCodes.OPERATION_CANCELED) {
        Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể chọn file' });
      }
    }
  };

  const pickPosterFile = async () => {
    try {
      const [res] = await pick({
        type: [types.images],
      });
      setSelectedPoster(res);
    } catch (err) {
      if (isErrorWithCode(err) && err.code !== errorCodes.OPERATION_CANCELED) {
        Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể chọn ảnh' });
      }
    }
  };

  

  const handleSubmit = async () => {
    if (!title || !category) {
      return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng điền đầy đủ thông tin' });
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('about', about);
      formData.append('category', category);

      if (selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        } as any);
      }

      if (selectedPoster) {
        formData.append('poster', {
          uri: selectedPoster.uri,
          name: selectedPoster.name,
          type: selectedPoster.type,
        } as any);
      }

      if (isEdit) {
        await updateAudio(audio._id, formData);
        Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã cập nhật âm thanh' });
      } else {
        if (!selectedFile) {
          setLoading(false);
          return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng chọn file âm thanh' });
        }
        await createAudio(formData);
        Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã thêm âm thanh mới' });
      }
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Đã có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name="times" iconStyle="solid" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Sửa âm thanh' : 'Thêm âm thanh'}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề..."
            placeholderTextColor={C.sub}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={about}
            onChangeText={setAbout}
            placeholder="Nhập mô tả..."
            placeholderTextColor={C.sub}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thể loại</Text>
          <View style={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fileSection}>
          <Text style={styles.label}>File âm thanh (.mp3, .wav...)</Text>
          <TouchableOpacity style={styles.fileBtn} onPress={pickAudioFile}>
            <FontAwesome5 name="music" iconStyle="solid" size={16} color={C.sub} />
            <Text style={styles.fileBtnText}>
              {selectedFile ? selectedFile.name : (isEdit ? 'Đã có file (nhấn để thay đổi)' : 'Chọn file âm thanh')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fileSection}>
          <Text style={styles.label}>Ảnh bìa (Poster)</Text>
          {(selectedPoster || audio?.poster?.url) && (
            <Image
              source={{ uri: selectedPoster?.uri || audio?.poster?.url }}
              style={styles.previewImage}
            />
          )}
          <TouchableOpacity style={styles.fileBtn} onPress={pickPosterFile}>
            <FontAwesome5 name="image" iconStyle="solid" size={16} color={C.sub} />
            <Text style={styles.fileBtnText}>
              {selectedPoster ? selectedPoster.name : (isEdit ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? 'Cập nhật' : 'Thêm mới'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: C.sub,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryChipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  categoryText: {
    color: C.sub,
    fontSize: 12,
  },
  categoryTextActive: {
    color: '#fff',
  },
  fileSection: {
    marginBottom: 20,
  },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: C.sub,
    gap: 10,
  },
  fileBtnText: {
    color: C.sub,
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: C.surface,
  },
  submitBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AudioForm;
