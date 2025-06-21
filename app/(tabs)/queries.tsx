import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useQueryStore } from '@/store/queryStore';
import QueryCard from '@/components/QueryCard';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/utils/api';

export default function QueriesScreen() {
  const { queries, isLoading, fetchQueries } = useQueryStore();
  const { isAuthenticated, user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // --- Poll State ---
  const [poll, setPoll] = useState<any>(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Fetch active poll on mount
  useEffect(() => {
    const fetchPoll = async () => {
      setPollLoading(true);
      setPollError('');
      try {
        const res = await api.getActivePoll();
        if (res.success && res.data) {
          setPoll(res.data);
          // Check if user has voted
          const userVote = res.data.votes?.find((v: any) => v.user === user?.id);
          setHasVoted(!!userVote);
          if (res.data._id) {
            const resultsRes = await api.getPollResults(res.data._id);
            if (resultsRes.success && resultsRes.data) setResults(resultsRes.data);
          }
        } else {
          setPoll(null);
          setResults(null);
        }
      } catch (err: any) {
        setPollError('Failed to load poll');
        setPoll(null);
        setResults(null);
      } finally {
        setPollLoading(false);
      }
    };
    fetchPoll();
  }, [user]);

  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    await fetchQueries();
    setRefreshing(false);
  };

  const handleAnswer = (queryId: string) => {
    router.push(`/query/${queryId}`);
  };

  const handleAskQuery = () => {
    router.push('/ask-query');
  };

  // --- Poll Voting Logic ---
  const handleVote = async () => {
    if (!selectedOption || !poll?._id) return;
    setPollLoading(true);
    setPollError('');
    try {
      const res = await api.votePoll(poll._id, selectedOption);
      if (res.success) {
        setHasVoted(true);
        // Fetch updated results
        const resultsRes = await api.getPollResults(poll._id);
        if (resultsRes.success && resultsRes.data) setResults(resultsRes.data);
      } else {
        setPollError(res.message || 'Failed to vote');
      }
    } catch (err: any) {
      setPollError('Failed to vote');
    } finally {
      setPollLoading(false);
    }
  };

  if (isLoading && !refreshing && queries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Poll Section --- */}
      {(pollLoading || poll || pollError) && (
        <View style={styles.pollContainer}>
          {pollLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : poll && results ? (
            <>
              <Text style={styles.pollQuestion}>{poll.question}</Text>
              {hasVoted || user?.role !== 'student' ? (
                results.results.map((opt: any) => (
                  <View key={opt.id} style={styles.pollResultRow}>
                    <Text style={styles.pollOptionText}>{opt.text}</Text>
                    <View style={styles.pollBarBg}>
                      <View style={[styles.pollBar, { width: `${opt.percent}%` }]} />
                    </View>
                    <Text style={styles.pollPercent}>{opt.percent}%</Text>
                  </View>
                ))
              ) : (
                poll.options.map((opt: any) => (
                  <TouchableOpacity
                    key={opt._id}
                    style={[styles.pollOptionBtn, selectedOption === opt._id && styles.pollOptionBtnSelected]}
                    onPress={() => setSelectedOption(opt._id)}
                    disabled={hasVoted || user?.role !== 'student'}
                  >
                    <Text style={styles.pollOptionText}>{opt.text}</Text>
                  </TouchableOpacity>
                ))
              )}
              {!hasVoted && user?.role === 'student' && (
                <Button
                  title="Submit Vote"
                  onPress={handleVote}
                  disabled={!selectedOption || pollLoading}
                  style={{ marginTop: 8 }}
                />
              )}
              <Text style={styles.pollDeadline}>Poll ends: {new Date(results.deadline).toLocaleDateString()}</Text>
              <Text style={styles.pollTotalVotes}>Total votes: {results.totalVotes}</Text>
            </>
          ) : pollError && !poll ? (
            <Text style={{ color: Colors.textSecondary }}>No poll has been shared yet</Text>
          ) : null}
        </View>
      )}
      {/* --- End Poll Section --- */}
      {/* All queries are shown to all users, regardless of answer status or role */}
      <FlatList
        data={queries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QueryCard 
            query={item} 
            onAnswer={handleAnswer}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No queries yet</Text>
            <Text style={styles.emptySubtext}>Ask a question to get career advice from alumni</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAskQuery}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pollContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    marginBottom: 0,
    elevation: 2,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  pollOptionBtn: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pollOptionBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.highlight,
  },
  pollOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  pollResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.inactive,
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  pollBar: {
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  pollPercent: {
    width: 40,
    textAlign: 'right',
    color: Colors.textSecondary,
    fontSize: 13,
  },
  pollDeadline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  pollTotalVotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});