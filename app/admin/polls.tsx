import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';
import { API_BASE_URL } from '@/utils/api';

export default function AdminPolls() {
  const { user, token } = useAuthStore();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.isVerified) {
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
      return;
    }
    const fetchPolls = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/polls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPolls(data.data);
        } else {
          setError(data.message || 'Failed to fetch polls');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching polls');
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, [token, user]);

  const handleCreatePoll = async () => {
    // TODO: Call backend to create poll
    // Refresh list after creation
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poll Creator & Monitor</Text>
      <View style={styles.pollForm}>
        <TextInput
          style={styles.input}
          placeholder="Poll Question"
          value={question}
          onChangeText={setQuestion}
        />
        {options.map((opt, idx) => (
          <TextInput
            key={idx}
            style={styles.input}
            placeholder={`Option ${idx + 1}`}
            value={opt}
            onChangeText={text => {
              const newOpts = [...options];
              newOpts[idx] = text;
              setOptions(newOpts);
            }}
          />
        ))}
        <TouchableOpacity onPress={() => setOptions([...options, ''])}><Text style={styles.addOption}>+ Add Option</Text></TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Deadline (YYYY-MM-DD)"
          value={deadline}
          onChangeText={setDeadline}
        />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreatePoll}>
          <Text style={styles.createBtnText}>Create Poll</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={polls}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.question}</Text>
            <Text style={styles.cell}>{item.deadline}</Text>
            <Text style={styles.cell}>{item.participationCount || 0}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Question</Text>
            <Text style={styles.headerCell}>Deadline</Text>
            <Text style={styles.headerCell}>Participation</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2233',
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pollForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  addOption: {
    color: Colors.primary,
    marginBottom: 8,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 4,
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    color: Colors.text,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2233',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
}); 