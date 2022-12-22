# add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/vendor/Lua)

target_include_directories(${EXE_NAME} PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/vendor/spdlog/include")

# target_link_libraries(
#   ${EXE_NAME}
#   PRIVATE
# )