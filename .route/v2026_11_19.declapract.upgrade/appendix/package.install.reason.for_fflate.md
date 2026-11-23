# reason: fflate@0.8.3

## package
- name: fflate
- version: 0.8.3
- type: prod

## reason
zip the reflect snapshot with a zero-dep writer; archiver pulls readable-stream, whose require cycles ship to consumers
