package com.airbnb.scheduler.jobs

import org.joda.time.{Minutes, Seconds, Hours, DateTime}
import com.airbnb.scheduler.graph.JobGraph
import com.airbnb.scheduler.state.PersistenceStore
import org.specs2.mock.Mockito
import org.specs2.mutable._
import java.util.concurrent.ScheduledThreadPoolExecutor
import com.google.common.util.concurrent.MoreExecutors

class JobSchedulerIntegrationTest extends SpecificationWithJUnit with Mockito {

  "JobScheduler" should {
//    Commented out as this doesn't work in OpenJDK6
//    "A job creates a failed task and then a successful task from a synchronous job" in {
//      val epsilon = Hours.hours(2).toPeriod
//      val job1 = new ScheduleBasedJob("R5/2012-01-01T00:00:00.000Z/P1D", "job1", "CMD", epsilon)
//
//      val exec = MoreExecutors.listeningDecorator(new ScheduledThreadPoolExecutor(1))
//
//      val jobGraph = new JobGraph
//      val persistenceStore = mock[PersistenceStore]
//      val taskManager = new TaskManager(exec, persistenceStore, jobGraph, null)
//
//      val scheduler = new JobScheduler(epsilon, taskManager, jobGraph, persistenceStore, jobMetrics = mock[JobMetrics])
//      val startTime = DateTime.parse("2012-01-01T01:00:00.000Z")
//      scheduler.leader.set(true)
//      scheduler.registerJob(job1, true, startTime)
//
//      val newStreams = scheduler.iteration(startTime, scheduler.streams)
//      newStreams(0).schedule must_== "R4/2012-01-02T00:00:00.000Z/P1D"
//      taskManager.queue.size must_== 1
//
//      val taskId1 = taskManager.queue.poll
//
//      scheduler.handleFailedTask(taskId1)
//
//      taskManager.queue.size must_== 1
//
//      val taskId2 = taskManager.queue.poll
//
//      scheduler.handleFinishedTask(taskId2)
//      there was one(persistenceStore)
//        .persistJob(new ScheduleBasedJob("R5/2012-01-01T00:00:00.000Z/P1D", "job1", "CMD", epsilon))
//
//      there was one(persistenceStore)
//        .persistJob(new ScheduleBasedJob("R4/2012-01-02T00:00:00.000Z/P1D", "job1", "CMD", epsilon))
//    }

    "Executing a job updates the job counts and errors" in {
      val epsilon = Minutes.minutes(20).toPeriod
      val jobName = "FOO"
      val job1 = new ScheduleBasedJob(schedule = "R/2012-01-01T00:00:00.000Z/PT1M",
        name = jobName, command = "fooo", epsilon = epsilon, retries = 0)

      val horizon = Minutes.minutes(5).toPeriod
      val mockTaskManager = mock[TaskManager]
      val graph = new JobGraph()
      val mockPersistenceStore = mock[PersistenceStore]
      val mockJobStats = mock[JobStats]

      val scheduler = new JobScheduler(horizon, mockTaskManager, graph, mockPersistenceStore, jobMetrics = mock[JobMetrics], jobStats = mockJobStats)
      scheduler.leader.set(true)
      scheduler.registerJob(job1, true, DateTime.parse("2011-01-01T00:05:01.000Z"))
      scheduler.run(() => { DateTime.parse("2012-01-01T00:05:01.000Z")})

      scheduler.handleFinishedTask(TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))
      val job2 = graph.lookupVertex(jobName).get
      scheduler.handleFinishedTask(TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))
      val job3 = graph.lookupVertex(jobName).get
      scheduler.handleFailedTask(TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))

      graph.lookupVertex(jobName).get.successCount must_== 2
      graph.lookupVertex(jobName).get.errorCount must_== 1

      there was one(mockJobStats).jobFinished(job1, TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0), 0)
      there was one(mockJobStats).jobFinished(job2, TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0), 0)
      there was one(mockJobStats).jobFailed(job3, TaskUtils.getTaskStatus(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0), 0)
    }

    "Tests that a disabled job does not run and does not execute dependant children." in {
      val epsilon = Minutes.minutes(20).toPeriod
      val job1 = new ScheduleBasedJob(schedule = "R/2012-01-01T00:00:00.000Z/PT1M",
        name = "job1", command = "fooo", epsilon = epsilon, disabled=true)
      val job2 = new DependencyBasedJob(Set("job1"), name = "job2", command = "CMD", disabled=true)

      val horizon = Minutes.minutes(5).toPeriod
      val mockTaskManager = mock[TaskManager]
      val graph = new JobGraph()
      val mockPersistenceStore = mock[PersistenceStore]

      val scheduler = new JobScheduler(horizon, mockTaskManager, graph, mockPersistenceStore, jobMetrics = mock[JobMetrics], jobStats = mock[JobStats])
      scheduler.leader.set(true)
      scheduler.registerJob(job1, true, DateTime.parse("2011-01-01T00:05:01.000Z"))
      scheduler.registerJob(job2, true, DateTime.parse("2011-01-01T00:05:01.000Z"))
      scheduler.run(() => { DateTime.parse("2012-01-01T00:05:01.000Z")})
/*
      scheduler.handleFinishedTask(TaskUtils.getTaskId(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))
      scheduler.handleFinishedTask(TaskUtils.getTaskId(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))
      scheduler.handleFailedTask(TaskUtils.getTaskId(job1, DateTime.parse("2012-01-03T00:00:01.000Z"), 0))
*/
      graph.lookupVertex("job1").get.successCount must_== 0
      graph.lookupVertex("job1").get.errorCount must_== 0
      graph.lookupVertex("job2").get.successCount must_== 0
      graph.lookupVertex("job2").get.errorCount must_== 0
    }
  }
}
