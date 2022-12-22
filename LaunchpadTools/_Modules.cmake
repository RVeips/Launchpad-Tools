set(FETCHCONTENT_QUIET FALSE)
set(FETCHCONTENT_UPDATES_DISCONNECTED ON)
include(FetchContent)

FetchContent_Declare(
  lib_RtMidi
  GIT_REPOSITORY https://github.com/CFXS/rtmidi
  GIT_TAG master
  GIT_SHALLOW TRUE
  GIT_PROGRESS TRUE
  USES_TERMINAL_DOWNLOAD TRUE
)

FetchContent_MakeAvailable(lib_RtMidi)

# add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/vendor/Lua)

target_include_directories(${EXE_NAME} PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/vendor/spdlog/include")

target_link_libraries(
    ${EXE_NAME}
    PRIVATE
    rtmidi
)