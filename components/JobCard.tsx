import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Job, Worker } from '../types';
import { isSafePassValid } from '../src/utils/ireland_compliance';

interface Props {
  job: Job;
  worker?: Worker;
}

export default function JobCard({ job, worker }: Props) {
  const safePassExpired = worker ? !isSafePassValid(worker.safePassExpiry) : false;

  return (
    <View style={styles.card}>
      <Text style={styles.trade}>{job.tradeType}</Text>
      <Text style={styles.location}>
        {job.location.address ?? `${job.location.lat.toFixed(4)}, ${job.location.lng.toFixed(4)}`}
      </Text>
      <Text style={styles.escrow}>Escrow: {job.escrowStatus}</Text>
      {worker && (
        <View style={[styles.badge, safePassExpired ? styles.badgeExpired : styles.badgeValid]}>
          <Text style={styles.badgeText}>
            Safe Pass Required{safePassExpired ? ' — EXPIRED' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trade: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  location: { fontSize: 14, color: '#555', marginBottom: 4 },
  escrow: { fontSize: 13, color: '#888', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  badgeValid: { backgroundColor: '#d4edda' },
  badgeExpired: { backgroundColor: '#f8d7da' },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
