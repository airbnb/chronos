FROM openjdk:8-jre
ARG http_proxy
ENV http_proxy ${http_proxy}

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv E56151BF \
    && echo "deb http://repos.mesosphere.com/debian jessie-unstable main" | tee /etc/apt/sources.list.d/mesosphere.list \
    && echo "deb http://repos.mesosphere.com/debian jessie-testing main" | tee -a /etc/apt/sources.list.d/mesosphere.list \
    && echo "deb http://repos.mesosphere.com/debian jessie main" | tee -a /etc/apt/sources.list.d/mesosphere.list \
    && apt-get update \
    && apt-get install --no-install-recommends -y --force-yes mesos=1.0.1-2.0.93.debian81 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ADD ./tmp/chronos.jar /chronos/chronos.jar
ADD bin/start.sh /chronos/bin/start.sh
ENTRYPOINT ["/chronos/bin/start.sh"]
